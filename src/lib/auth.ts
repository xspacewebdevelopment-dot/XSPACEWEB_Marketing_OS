import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

export const SESSION_COOKIE_NAME = "nexareach_session";
export const ACTIVE_WORKSPACE_COOKIE = "nexareach_workspace_id";
const SESSION_DURATION_DAYS = 30;

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  role: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Creates a real database-backed session token and sets secure HTTP-only cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Destroys current session in database and clears cookies.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch {
      // Ignore if session already deleted
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
}

/**
 * Retrieves the currently authenticated user from the database via secure session token.
 * Never creates fake or hardcoded identities.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          memberships: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt < new Date()) {
    try {
      await prisma.session.delete({ where: { token } });
    } catch {
      // ignore
    }
    return null;
  }

  return session.user;
}

/**
 * Enforces authentication and tenant isolation.
 * Guarantees that the returned user belongs to the active workspace.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const requestedWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  let activeMembership = requestedWorkspaceId
    ? user.memberships.find((m) => m.workspaceId === requestedWorkspaceId)
    : user.memberships[0];

  // If user has no workspace yet, create a default workspace for them
  if (!activeMembership) {
    if (user.memberships.length > 0) {
      activeMembership = user.memberships[0];
    } else {
      const workspace = await prisma.workspace.create({
        data: {
          name: `${user.name || "Default"}'s Workspace`,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
          settings: {
            create: {},
          },
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
        role: "OWNER",
      };
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    workspace: {
      id: activeMembership.workspace.id,
      name: activeMembership.workspace.name,
    },
    role: activeMembership.role,
  };
}

/**
 * Strict server-side auth guard. Throws error if not authenticated.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) {
    throw new Error("UNAUTHORIZED");
  }
  return auth;
}

/**
 * Creates or gets the verified development user for local dev testing.
 * Stored in Neon PostgreSQL with an actual hashed password and personal workspace.
 */
export async function getOrCreateDevUser() {
  const devEmail = normalizeEmail("dev@nexareach.com");
  let user = await prisma.user.findUnique({
    where: { email: devEmail },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });

  if (!user) {
    const passwordHash = await hashPassword("NexaReach2026!");
    user = await prisma.user.create({
      data: {
        email: devEmail,
        name: "Arijeet (NexaReach Dev)",
        passwordHash,
        memberships: {
          create: {
            role: "OWNER",
            workspace: {
              create: {
                name: "NexaReach Core Workspace",
                settings: {
                  create: {
                    removeDuplicates: true,
                    excludeDisposable: true,
                    flagCatchAll: true,
                    excludeInvalid: true,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });
  }

  return user;
}

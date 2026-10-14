import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { normalizeEmail } from "@/lib/utils";

// Allow signup with ONLY email and password, optional name and workspace
const signupSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
  workspaceName: z.string().optional(),
});

function formatNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "User";
  // Clean dots, dashes, numbers and format name
  const clean = localPart.replace(/[._\-+]/g, " ").trim();
  if (!clean) return "User";
  return clean
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(result.data.email);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Auto-generate profile name and workspace if only email and password were provided
    const derivedName = result.data.name?.trim() || formatNameFromEmail(email);
    const workspaceName =
      result.data.workspaceName?.trim() || `${derivedName}'s Workspace`;

    const passwordHash = await hashPassword(result.data.password);

    // Create User, Tenant Workspace, Default Settings & Member in one transaction
    const user = await prisma.user.create({
      data: {
        email,
        name: derivedName,
        passwordHash,
        memberships: {
          create: {
            role: "OWNER",
            workspace: {
              create: {
                name: workspaceName,
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
          include: {
            workspace: true,
          },
        },
      },
    });

    // Create session cookie and log user in immediately
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace: user.memberships[0]?.workspace || {
          name: workspaceName,
        },
      },
    });
  } catch (error) {
    console.error("Signup profile creation error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

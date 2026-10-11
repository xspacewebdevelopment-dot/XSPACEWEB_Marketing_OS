import { NextResponse } from "next/server";
import { createSession, getOrCreateDevUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getOrCreateDevUser();
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Development session authenticated successfully with Neon PostgreSQL",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create dev session" },
      { status: 500 }
    );
  }
}

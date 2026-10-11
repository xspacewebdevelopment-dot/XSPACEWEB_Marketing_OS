import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const auth = await getAuthContext();

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { workspace } = auth;
    const workspaceId = workspace.id;

    let settings = await prisma.verificationSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      settings = await prisma.verificationSettings.create({
        data: {
          workspaceId,
          removeDuplicates: true,
          excludeDisposable: true,
          flagCatchAll: true,
          excludeInvalid: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error in settings endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load verification settings" },
      { status: 500 }
    );
  }
}

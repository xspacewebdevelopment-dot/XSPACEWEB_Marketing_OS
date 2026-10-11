import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";


export async function GET() {
  const auth = await getAuthContext();

  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: auth,
  });
}

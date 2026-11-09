import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/features/auth/constants";

import { createAdminClient } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");

  if (!userId || !secret) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const origin = request.nextUrl.origin;

  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(userId, secret);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error("[auth/oauth] callback failed", error);

    return NextResponse.redirect(`${origin}/sign-up`);
  }
}

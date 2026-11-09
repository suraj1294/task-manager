"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite";

const getAppUrl = async () => {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ?? (await headers()).get("origin");

  return url?.replace(/\/$/, "");
};

const signInWithProvider = async (provider: OAuthProvider) => {
  const { account } = await createAdminClient();
  const appUrl = await getAppUrl();

  if (!appUrl) {
    throw new Error(
      "Cannot determine the app URL: set NEXT_PUBLIC_APP_URL or send an origin header",
    );
  }

  let redirectUrl: string;

  try {
    redirectUrl = await account.createOAuth2Token(
      provider,
      `${appUrl}/oauth`,
      `${appUrl}/sign-up`,
    );
  } catch (error) {
    console.error(`[auth/oauth] ${provider} sign-in failed`, error);
    throw error;
  }

  return redirect(redirectUrl);
};

export async function signUpWithGithub() {
  return signInWithProvider(OAuthProvider.Github);
}

export async function signUpWithGoogle() {
  return signInWithProvider(OAuthProvider.Google);
}

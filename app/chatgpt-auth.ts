import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin";
export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};
// Retained export names keep the UI contract stable; identity is now verified Firebase auth.
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const authorization = (await headers()).get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  if (!token) return null;
  try {
    const user = await auth().verifyIdToken(token, true);
    return {
      userId: user.uid,
      displayName: user.name || user.email || "Reviewer",
      email: user.email || "",
      fullName: user.name || null,
    };
  } catch {
    return null;
  }
}
export async function requireChatGPTUser(returnTo: string) {
  const user = await getChatGPTUser();
  if (!user) redirect(chatGPTSignInPath(returnTo));
  return user;
}
export function chatGPTSignInPath(returnTo: string) {
  return (
    "/signin?return_to=" +
    encodeURIComponent(
      returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/workspace",
    )
  );
}
export function chatGPTSignOutPath() {
  return "/signout";
}

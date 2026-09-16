import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
let pending: Promise<Auth> | undefined;
export const getClientAuth = () =>
  (pending ??= (async () => {
    const response = await fetch("/firebase-config.json");
    if (!response.ok)
      throw new Error("Sign-in is unavailable. Please retry shortly.");
    const config = (await response.json()) as FirebaseOptions;
    const auth = getAuth(getApps()[0] || initializeApp(config));
    await setPersistence(auth, browserLocalPersistence);
    await auth.authStateReady();
    return auth;
  })().catch((error) => {
    pending = undefined;
    throw error;
  }));
let apiOrigin = "";
export function setApiOrigin(value: string) {
  apiOrigin = value.replace(/\/$/, "");
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const auth = await getClientAuth();
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", "Bearer " + token);
  return fetch(apiOrigin + path, { ...init, headers, cache: "no-store" });
}

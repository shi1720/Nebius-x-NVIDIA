import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
export const adminApp = () =>
  getApps()[0] ||
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "recallroom-ai-2026",
    storageBucket: process.env.STORAGE_BUCKET || "recallroom-ai-2026-evidence",
  });
export const auth = () => getAuth(adminApp());
export const database = () => getFirestore(adminApp());
export const bucket = () => getStorage(adminApp()).bucket();

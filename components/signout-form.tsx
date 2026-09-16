"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { LoaderCircle } from "lucide-react";
import { getClientAuth } from "@/lib/firebase-client";
import { AuthShell } from "./auth-form";

export default function SignOutForm() {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    void getClientAuth()
      .then((auth) => signOut(auth))
      .then(() => {
        if (mounted) window.location.replace("/");
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  return (
    <AuthShell>
      <h2 className="mb-4 text-3xl font-semibold tracking-tight">
        {error ? "Sign-out could not finish." : "Signing you out."}
      </h2>
      {error ? (
        <div role="alert">
          <p className="mb-6 text-sm leading-6 text-[#62747a]">
            Your session may still be active. Check your connection and try
            again before leaving this device.
          </p>
          <button
            className="w-full rounded-lg bg-[#136956] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#0f5545]"
            onClick={() => {
              setError(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try signing out again
          </button>
        </div>
      ) : (
        <p
          role="status"
          className="flex items-center gap-3 text-sm text-[#62747a]"
        >
          <LoaderCircle size={18} className="animate-spin" />
          Closing your private workspace session...
        </p>
      )}
    </AuthShell>
  );
}

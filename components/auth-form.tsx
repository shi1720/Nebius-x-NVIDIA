"use client";
/* Native navigation also supports the standalone Firebase Hosting frontend. */
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-location-assign-relative-destination */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { getClientAuth } from "@/lib/firebase-client";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Files,
  LoaderCircle,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-[#d7e0e3] bg-white px-3.5 py-3 text-[15px] text-[#162c35] outline-none focus:border-[#347f6b] focus:ring-2 focus:ring-[#347f6b]/20 disabled:bg-[#f0f4f5]";
const buttonClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-[#136956] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#0f5545] disabled:opacity-50";

function friendlyError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    "auth/invalid-credential":
      "That email and password could not be verified. Try again or reset your password.",
    "auth/wrong-password":
      "That email and password could not be verified. Try again or reset your password.",
    "auth/user-not-found":
      "That email and password could not be verified. Try again or reset your password.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/email-already-in-use":
      "An account already uses this email. Sign in or reset your password.",
    "auth/weak-password":
      "Choose a stronger password with at least 12 characters.",
    "auth/password-does-not-meet-requirements":
      "Choose a stronger password with at least 12 characters, including uppercase and lowercase letters, a number and a symbol.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a few minutes before trying again.",
    "auth/network-request-failed":
      "The connection was interrupted. Check your internet connection and try again.",
    "auth/popup-blocked":
      "Your browser blocked the Google sign-in window. Allow popups for this site or use email and password.",
    "auth/popup-closed-by-user":
      "Google sign-in was closed before it finished. Try again or use email and password.",
    "auth/cancelled-popup-request":
      "Another Google sign-in window is already open. Complete that window or try again.",
    "auth/account-exists-with-different-credential":
      "This email already uses another sign-in method. Sign in with that method first.",
    "auth/operation-not-allowed":
      "This sign-in method is temporarily unavailable. Try another method.",
    "auth/unauthorized-domain":
      "Google sign-in is not configured for this address yet. Use email and password.",
    "auth/user-disabled":
      "This account cannot sign in. Contact the workspace administrator.",
  };
  return (
    messages[code] ||
    (error instanceof Error && error.name === "SessionError"
      ? error.message
      : "Sign-in could not finish. Please try again.")
  );
}

function sessionError(message: string) {
  const error = new Error(message);
  error.name = "SessionError";
  return error;
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-[#f6f8fa] text-[#162c35]">
      <aside className="hidden w-[43%] flex-col justify-between bg-[#122d36] p-12 text-white lg:flex xl:p-16">
        <a
          href="/"
          className="flex w-fit items-center gap-3 text-xl font-bold tracking-tight"
        >
          <span className="rounded-xl border border-white/20 p-2.5 text-[#a6e1cb]">
            <ScanLine size={26} />
          </span>
          RecallRoom
        </a>
        <div className="my-16 max-w-md">
          <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-[#a6e1cb]">
            FROM SOURCE RECORD TO CLEAR ACTION
          </p>
          <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight xl:text-5xl">
            Keep the evidence.
            <br />
            Find the affected lot.
          </h1>
          <p className="mt-6 text-base leading-7 text-[#bacdd3]">
            A private workspace for recall investigations. Bring your records
            together, follow the connections, and keep every review decision
            attached to its evidence.
          </p>
          <div className="mt-10 space-y-5 border-t border-white/15 pt-8">
            {[
              [Files, "Original records, preserved"],
              [ScanLine, "Every connection linked to its source"],
              [ShieldCheck, "Decisions stay with your quality team"],
            ].map(([Icon, text]) => {
              const ItemIcon = Icon as typeof Files;
              return (
                <p
                  key={String(text)}
                  className="flex items-center gap-3 text-sm text-[#dde8eb]"
                >
                  <ItemIcon size={19} className="shrink-0 text-[#a6e1cb]" />
                  {String(text)}
                </p>
              );
            })}
          </div>
        </div>
        <p className="max-w-sm text-xs leading-5 text-[#a3bbc3]">
          Your investigations are private to your account. Public visitors can
          explore the separate synthetic drill.
        </p>
      </aside>
      <section className="flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-14">
        <a
          href="/"
          className="flex w-fit items-center gap-2 text-sm font-medium text-[#62747a] hover:text-[#136956]"
        >
          <ArrowLeft size={16} />
          Back to the demo
        </a>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <div className="mb-8 flex items-center gap-2 text-lg font-bold lg:hidden">
            <ScanLine className="text-[#136956]" size={25} />
            RecallRoom
          </div>
          {children}
        </div>
        <p className="text-center text-xs leading-5 text-[#62747a]">
          Evidence informs decisions. RecallRoom does not certify food safety.
        </p>
      </section>
    </main>
  );
}

export default function AuthForm() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [configStatus, setConfigStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [configAttempt, setConfigAttempt] = useState(0);
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = await getClientAuth();
        if (!cancelled) {
          setAuth(client);
          setConfigStatus("ready");
        }
      } catch {
        if (!cancelled) setConfigStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configAttempt]);

  const changeMode = (next: typeof mode) => {
    setMode(next);
    setPassword("");
    setError("");
    setNotice("");
    setShowPassword(false);
  };

  const authenticate = async (google: boolean) => {
    if (!auth || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "reset" && !google) {
        await sendPasswordResetEmail(auth, email.trim());
        setNotice(
          "If this email has an account, a password reset link is on its way. Check your inbox and spam folder.",
        );
        return;
      }
      let user: User;
      if (google) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        user = (await signInWithPopup(auth, provider)).user;
      } else if (mode === "signup") {
        if (!displayName.trim())
          throw sessionError(
            "Enter the name to show on your review decisions.",
          );
        if (password.length < 12)
          throw sessionError("Use a password with at least 12 characters.");
        user = (
          await createUserWithEmailAndPassword(auth, email.trim(), password)
        ).user;
        try {
          await updateProfile(user, { displayName: displayName.trim() });
        } catch {
          setMode("signin");
          throw sessionError(
            "Your account was created, but your display name could not be saved. Sign in with your new email and password to continue.",
          );
        }
      } else {
        user = (await signInWithEmailAndPassword(auth, email.trim(), password))
          .user;
      }
      window.location.assign("/workspace");
    } catch (caught) {
      setError(friendlyError(caught));
      await signOut(auth).catch(() => {});
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void authenticate(false);
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#136956]">
          <LockKeyhole size={15} />
          PRIVATE INVESTIGATION WORKSPACE
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          {mode === "signup"
            ? "Make room for your records."
            : mode === "reset"
              ? "Reset your password."
              : "Welcome to RecallRoom."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#62747a]">
          {mode === "signup"
            ? "Create an account to save sources, review lot relationships and build your investigation history."
            : mode === "reset"
              ? "Enter your account email and we will send instructions to choose a new password."
              : "Sign in to continue your investigations. Your sources and review history will be here."}
        </p>
      </div>
      {configStatus === "loading" ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-[#e0e6e8] bg-white p-5 text-sm"
        >
          <LoaderCircle size={18} className="animate-spin text-[#136956]" />
          Preparing secure sign-in...
        </div>
      ) : configStatus === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-[#e4cda3] bg-[#fff8e9] p-5 text-sm leading-6"
        >
          <strong>Sign-in is temporarily unavailable.</strong>
          <p className="mt-1">
            The workspace configuration could not load. Try again in a moment,
            or explore the sample while it reconnects.
          </p>
          <button
            className="mt-4 font-semibold text-[#136956] underline underline-offset-4"
            onClick={() => {
              setConfigStatus("loading");
              setConfigAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-lg border border-[#e9c4c1] bg-[#fff3f2] px-4 py-3 text-sm leading-6 text-[#9b3732]"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="mb-5 flex items-start gap-2 rounded-lg border border-[#bdd9ca] bg-[#edf7f1] px-4 py-3 text-sm leading-6 text-[#185b44]"
            >
              <Check size={17} className="mt-1 shrink-0" />
              {notice}
            </p>
          )}
          {mode !== "reset" && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void authenticate(true)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#d7e0e3] bg-white px-4 py-3.5 text-sm font-semibold hover:bg-[#edf3f1]"
              >
                Continue with Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs text-[#62747a]">
                <span className="h-px flex-1 bg-[#e0e6e8]" />
                or use your email
                <span className="h-px flex-1 bg-[#e0e6e8]" />
              </div>
            </>
          )}
          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Your name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  maxLength={80}
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={busy}
                  className={inputClass}
                  placeholder="Name shown on review decisions"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="auth-email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className={inputClass}
                placeholder="you@company.com"
              />
            </div>
            {mode !== "reset" && (
              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    required
                    minLength={mode === "signup" ? 12 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className={`${inputClass} pr-12`}
                    aria-describedby={
                      mode === "signup" ? "password-hint" : undefined
                    }
                  />
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3.5 text-[#62747a]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p
                    id="password-hint"
                    className="mt-2 text-xs leading-5 text-[#62747a]"
                  >
                    At least 12 characters. Use a password unique to this
                    account.
                  </p>
                )}
              </div>
            )}
            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode("reset")}
                  className="text-sm font-medium text-[#136956] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {mode === "signup"
                    ? "Create your account"
                    : mode === "reset"
                      ? "Send reset link"
                      : "Open your workspace"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <div className="mt-7 text-center text-sm text-[#62747a]">
            {mode === "signin" ? (
              <>
                New to RecallRoom?{" "}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode("signup")}
                  className="font-semibold text-[#136956] hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => changeMode("signin")}
                className="font-semibold text-[#136956] hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </>
      )}
    </AuthShell>
  );
}

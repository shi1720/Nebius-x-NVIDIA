import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import RecallRoom from "./components/recall-room";
import AuthForm from "./components/auth-form";
import SignoutForm from "./components/signout-form";
import { getClientAuth, setApiOrigin } from "./lib/firebase-client";
import "./app/globals.css";
setApiOrigin(import.meta.env.VITE_API_ORIGIN || "");
function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined),
    [error, setError] = useState("");
  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;
    getClientAuth()
      .then((auth) => {
        if (active) unsubscribe = onAuthStateChanged(auth, setUser);
      })
      .catch(() => setError("Sign-in could not load. Reload to try again."));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  if (location.pathname === "/signin") return <AuthForm />;
  if (location.pathname === "/signout") return <SignoutForm />;
  if (location.pathname === "/workspace") {
    if (error)
      return (
        <main className="p-12 text-center">
          <h1 className="text-2xl">Connection unavailable</h1>
          <p>{error}</p>
          <a href="/">Explore the public drill</a>
        </main>
      );
    if (user === undefined)
      return (
        <main className="p-12 text-center" role="status">
          Opening your private workspace...
        </main>
      );
    if (!user) {
      location.replace("/signin");
      return null;
    }
    return (
      <RecallRoom
        key={user.uid}
        persistent
        user={{
          name: user.displayName || user.email || "Reviewer",
          email: user.email || "",
        }}
      />
    );
  }
  return <RecallRoom />;
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

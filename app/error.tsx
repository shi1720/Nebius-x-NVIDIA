/* eslint-disable @next/next/no-html-link-for-pages -- Error recovery requires a fresh document load. */
"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("RecallRoom page error", {
      digest: error.digest,
      name: error.name,
    });
  }, [error]);
  return (
    <main className="empty-card" style={{ maxWidth: 700, margin: "15vh auto" }}>
      <h1>The investigation could not load.</h1>
      <p>
        Your last saved records have not been replaced. Retry this page, or
        return to the public sample.
      </p>
      <button className="primary" onClick={reset}>
        Retry loading
      </button>
      <p>
        <a href="/">Open the synthetic drill</a>
      </p>
    </main>
  );
}

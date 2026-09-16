/* eslint-disable @next/next/no-html-link-for-pages -- Error recovery requires a fresh document load. */
export default function NotFound() {
  return (
    <main className="empty-card" style={{ maxWidth: 650, margin: "15vh auto" }}>
      <h1>This page is outside the trace.</h1>
      <p>The requested page could not be found.</p>
      <a className="primary" href="/">
        Return to RecallRoom
      </a>
    </main>
  );
}

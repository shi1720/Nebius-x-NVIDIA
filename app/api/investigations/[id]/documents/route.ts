import {
  identity,
  loadInvestigation,
  saveInvestigation,
  apiError,
  json,
  sameOrigin,
  bindings,
  boundedBody,
  ApiError,
} from "@/lib/server";
import { addAudit } from "@/lib/domain";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let uploadedKey: string | undefined;
  try {
    sameOrigin(request);
    const user = await identity();
    if (Number(request.headers.get("content-length")) > 2300000)
      throw new ApiError(413, "Each file must be at most 2 MB.");
    const body = await boundedBody(request, 2300000);
    const form = await new Response(body, {
        headers: { "Content-Type": request.headers.get("content-type") || "" },
      }).formData(),
      file = form.get("file"),
      clientText = form.get("text"),
      revision = Number(form.get("revision"));
    if (
      !(file instanceof File) ||
      typeof clientText !== "string" ||
      file.size > 2000000 ||
      file.size === 0 ||
      clientText.length > 60000 ||
      !clientText.trim()
    )
      throw new ApiError(
        400,
        "Provide a non-empty TXT, CSV, JSON or text PDF (up to 2 MB and 60,000 extracted characters).",
      );
    if (!/\.(txt|csv|json|pdf)$/i.test(file.name))
      throw new ApiError(
        400,
        "Supported files: .txt, .csv, .json and text-based .pdf.",
      );
    const isPdf = /\.pdf$/i.test(file.name);
    const text = isPdf ? clientText : await file.text();
    if (!text.trim() || text.length > 60000)
      throw new ApiError(413, "The source text is empty or too large.");
    const inv = await loadInvestigation((await ctx.params).id, user.userId);
    if (inv.revision !== revision)
      throw new ApiError(409, "Reload the investigation before uploading.");
    if (
      inv.documents.length >= 12 ||
      inv.documents.reduce((a, d) => a + d.text.length, 0) + text.length > 90000
    )
      throw new ApiError(
        413,
        "Use up to 12 documents and 90,000 extracted text characters per investigation.",
      );
    const bytes = await file.arrayBuffer();
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (inv.documents.some((d) => d.sha256 === hash))
      throw new ApiError(
        409,
        "This exact file is already in the evidence library.",
      );
    const id = "doc-" + crypto.randomUUID(),
      key = `${inv.id}/${id}`;
    await bindings().BUCKET.put(key, bytes, {
      httpMetadata: { contentType: "application/octet-stream" },
    });
    uploadedKey = key;
    const name = file.name.replace(/[^\w. ()-]/g, "_").slice(0, 180);
    const textHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
      ),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const doc = {
      id,
      name,
      text,
      sha256: hash,
      textSha256: textHash,
      extractionMethod: isPdf
        ? ("browser-pdf" as const)
        : ("server-text" as const),
      textVerified: !isPdf,
      uploadedAt: new Date().toISOString(),
      storageKey: key,
      mimeType: file.type,
    };
    const next = addAudit(
      { ...inv, documents: [...inv.documents, doc], draft: null },
      user.displayName,
      "Evidence uploaded",
      `${name}; SHA-256 ${hash}. Any previous extraction draft was invalidated.`,
    );
    await saveInvestigation(next, user.userId, revision);
    uploadedKey = undefined;
    return json({ investigation: next });
  } catch (e) {
    if (uploadedKey)
      await bindings()
        .BUCKET.delete(uploadedKey)
        .catch(() => {});
    return apiError(e);
  }
}
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await identity(),
      inv = await loadInvestigation((await ctx.params).id, user.userId);
    const doc = inv.documents.find(
      (d) => d.id === new URL(request.url).searchParams.get("document"),
    );
    if (!doc) throw new ApiError(404, "Document not found.");
    if (!doc.storageKey)
      return new Response(doc.text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${doc.name}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    const object = await bindings().BUCKET.get(doc.storageKey);
    if (!object) throw new ApiError(404, "Original file not found.");
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

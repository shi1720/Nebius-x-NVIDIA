export async function readSourceFile(file: File): Promise<string> {
  if (file.size > 2_000_000)
    throw new Error("Choose a file smaller than 2 MB.");
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
    try {
      if (pdf.numPages > 30)
        throw new Error("Use a PDF with 30 pages or fewer.");
      const pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n),
          content = await page.getTextContent();
        pages.push(
          `Page ${n}\n` +
            content.items
              .map((item) =>
                "str" in item
                  ? item.str + ("hasEOL" in item && item.hasEOL ? "\n" : " ")
                  : "",
              )
              .join(""),
        );
      }
      const text = pages.join("\n\n");
      if (text.replace(/Page \d+/g, "").trim().length < 20)
        throw new Error(
          "This PDF has no readable text layer. Export it with OCR or upload a text version; RecallRoom will not guess scanned content.",
        );
      return text;
    } finally {
      await pdf.destroy();
    }
  }
  if (!/\.(txt|csv|json)$/i.test(file.name))
    throw new Error("Use TXT, CSV, JSON, or a PDF with selectable text.");
  const text = await file.text();
  if (!text.trim()) throw new Error("The file is empty.");
  return text;
}

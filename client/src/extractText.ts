import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * @param onProgress — 0–100 while reading the file (PDF pages or quick pass for .txt)
 */
export async function extractTextFromFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const report = (pct: number) => {
    onProgress?.(Math.min(100, Math.max(0, Math.round(pct))));
  };

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".txt")) {
    report(15);
    const text = await file.text();
    report(100);
    return text;
  }
  if (lower.endsWith(".pdf")) {
    report(5);
    const data = new Uint8Array(await file.arrayBuffer());
    report(12);
    const pdf = await pdfjs.getDocument({ data }).promise;
    const numPages = pdf.numPages;
    const parts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) =>
        "str" in item ? item.str : "",
      );
      parts.push(strings.join(" "));
      report(12 + ((i / numPages) * 88));
    }
    report(100);
    return parts.join("\n\n").replace(/\s+/g, " ").trim();
  }
  throw new Error("Unsupported file type. Use .pdf or .txt for now.");
}

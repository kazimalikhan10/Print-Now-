export async function getPdfPageCount(file) {
  if (!file) return 1;

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
    }).promise;
    return Math.max(1, Number(pdf.numPages) || 1);
  } catch {
    // Lightweight fallback for environments where PDF.js cannot initialise.
    try {
      const text = new TextDecoder('latin1').decode(await file.arrayBuffer());
      const matches = text.match(/\/Type\s*\/Page\b/g);
      return Math.max(1, matches?.length || 1);
    } catch {
      return 1;
    }
  }
}

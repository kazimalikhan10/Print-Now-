export async function getPdfPageCount(file) {
  if (!file) return 1;

  try {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    });
    const pdf = await loadingTask.promise;
    const count = Math.max(1, Number(pdf.numPages) || 1);
    await pdf.destroy();
    return count;
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

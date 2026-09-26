import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { getSelectedPageNumbers } from '../../utils';
import PrintPagePreview from './PrintPagePreview';

function decodeXmlText(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const paragraphs = [...doc.getElementsByTagNameNS('*', 'p')];
  return paragraphs
    .map((p) => [...p.getElementsByTagNameNS('*', 't')].map((t) => t.textContent).join(''))
    .join('\n');
}

function findEndOfCentralDirectory(bytes) {
  const minOffset = Math.max(0, bytes.length - 0x10000 - 22);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b && bytes[offset + 2] === 0x05 && bytes[offset + 3] === 0x06) return offset;
  }
  return -1;
}

async function extractDocxText(file) {
  if (!file?.arrayBuffer) return '';
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const eocd = findEndOfCentralDirectory(bytes);
  if (eocd < 0) return '';

  const entryCount = view.getUint16(eocd + 10, true);
  const centralDirectoryOffset = view.getUint32(eocd + 16, true);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount && offset + 46 <= bytes.length; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));

    if (name === 'word/document.xml') {
      if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) return '';
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const data = bytes.slice(dataStart, dataStart + compressedSize);

      if (method === 0) return decodeXmlText(decoder.decode(data));
      if (method === 8 && typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return decodeXmlText(await new Response(stream).text());
      }
      return '';
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return '';
}

function PdfPreview({ file, onPageCount }) {
  const canvasRef = useRef(null);
  const passwordCallbackRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const selectedPages = useMemo(() => getSelectedPageNumbers(file), [file]);
  const selectedKey = selectedPages.join(',');

  useEffect(() => {
    let cancelled = false;
    let loadedPdf = null;
    passwordCallbackRef.current = null;
    setPdf(null);
    setLoading(true);
    setPasswordRequired(false);
    setPasswordError(false);
    setPdfError('');
    setPassword('');
    setPageIndex(0);

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const buffer = await file.sourceFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        });
        loadingTask.onPassword = (callback, reason) => {
          if (cancelled) return;
          passwordCallbackRef.current = callback;
          setPasswordError(reason === pdfjsLib.PasswordResponses?.INCORRECT_PASSWORD);
          setPasswordRequired(true);
          setLoading(false);
        };
        loadedPdf = await loadingTask.promise;
        if (cancelled) {
          loadedPdf.destroy();
          return;
        }
        setPdf(loadedPdf);
        setPasswordRequired(false);
        setPasswordError(false);
        setLoading(false);
        if (typeof onPageCount === 'function') onPageCount(Math.max(1, Number(loadedPdf.numPages) || 1));
      } catch (error) {
        if (!cancelled) {
          setPdf(null);
          setPasswordRequired(false);
          setLoading(false);
          setPdfError(error?.message || 'PDF could not be loaded.');
        }
      }
    })();

    return () => {
      cancelled = true;
      passwordCallbackRef.current = null;
      loadedPdf?.destroy();
    };
  }, [file.sourceFile]);

  useEffect(() => {
    setPageIndex((index) => Math.min(index, Math.max(0, selectedPages.length - 1)));
  }, [selectedKey, selectedPages.length]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!pdf || !canvasRef.current || !selectedPages.length) return;
      const pageNumber = selectedPages[pageIndex];
      if (!pageNumber) return;
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        await page.render({ canvasContext: context, viewport }).promise;
        if (cancelled) return;
      } catch { /* keep the previous rendered state */ }
    };
    render();
    return () => { cancelled = true; };
  }, [pdf, pageIndex, selectedKey]);

  const submitPassword = (event) => {
    event.preventDefault();
    if (!passwordCallbackRef.current || !password) return;
    setLoading(true);
    setPasswordRequired(false);
    passwordCallbackRef.current(password);
    passwordCallbackRef.current = null;
  };

  if (loading) return <div className="flex h-full items-center justify-center text-[.7rem] text-[#73798a]">Loading PDF…</div>;

  if (passwordRequired) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f0efff] text-[#4a43e8]"><LockKeyhole size={21} /></div>
        <div>
          <strong className="block text-[.82rem] text-[#202532]">Password-protected PDF</strong>
          <span className="mt-1 block text-[.67rem] leading-[1.45] text-[#73798a]">Enter the PDF password to preview and select its pages.</span>
        </div>
        <form onSubmit={submitPassword} className="flex w-full max-w-[300px] flex-col gap-2">
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setPasswordError(false); }}
            placeholder="PDF password"
            className="h-10 rounded-lg border border-[#dfe2ea] px-3 text-[.75rem] outline-none focus:border-[#4a43e8]"
          />
          {passwordError && <span className="inline-flex items-center justify-center gap-1 text-[.62rem] font-semibold text-red-600"><AlertCircle size={13} /> Incorrect password. Try again.</span>}
          <button type="submit" className="h-10 rounded-lg bg-[#4a43e8] text-[.72rem] font-bold text-white">Unlock PDF</button>
        </form>
      </div>
    );
  }

  if (!pdf) return (
    <div className="document-preview-fallback">
      <strong>{file.name}</strong>
      <span>PDF preview unavailable</span>
      {pdfError && <small className="mt-1 max-w-[320px] text-center text-[.58rem] text-[#8a5160]">{pdfError}</small>}
    </div>
  );

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < selectedPages.length - 1;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <canvas ref={canvasRef} className={file.options.color === 'bw' ? 'preview-bw block h-auto w-full' : 'block h-auto w-full'} />
      </div>
      <div className="flex items-center gap-2 border-t border-[#e8e9ef] bg-white px-2.5 py-2">
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dfe2ea] bg-white text-[#4a43e8] disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setPageIndex((index) => Math.max(0, index - 1))} disabled={!canPrev} aria-label="Previous selected page"><ChevronLeft size={16} /></button>
        <input className="h-7 min-w-0 flex-1 cursor-pointer accent-[#4b46e8]" type="range" min="0" max={Math.max(0, selectedPages.length - 1)} step="1" value={pageIndex} onChange={(event) => setPageIndex(Number(event.target.value))} aria-label="PDF page" />
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dfe2ea] bg-white text-[#4a43e8] disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setPageIndex((index) => Math.min(selectedPages.length - 1, index + 1))} disabled={!canNext} aria-label="Next selected page"><ChevronRight size={16} /></button>
        <span className="min-w-[72px] text-right text-[.64rem] font-semibold text-[#646c7c]">Page {selectedPages[pageIndex]} · {pageIndex + 1}/{selectedPages.length}</span>
      </div>
    </div>
  );
}

export default function DocumentPreview({ file, onPageCount }) {
  const [docxText, setDocxText] = useState('');
  const isPdf = file.sourceFile?.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isDocx = file.sourceFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(file.name);

  useEffect(() => {
    let cancelled = false;
    setDocxText('');
    if (isDocx && file.sourceFile) {
      extractDocxText(file.sourceFile)
        .then((text) => { if (!cancelled) setDocxText(text); })
        .catch(() => { if (!cancelled) setDocxText(''); });
    }
    return () => { cancelled = true; };
  }, [file.sourceFile, isDocx]);

  if (isPdf && file.sourceFile) return <PrintPagePreview file={file}><PdfPreview file={file} onPageCount={onPageCount} /></PrintPagePreview>;

  if (isDocx && docxText) {
    return <PrintPagePreview file={file}><div className={`docx-preview ${file.options.color === 'bw' ? 'preview-bw' : ''}`}>{docxText.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}</div></PrintPagePreview>;
  }

  return <PrintPagePreview file={file}><div className="document-preview-fallback"><strong>{file.name}</strong><span>{isDocx ? 'DOCX preview unavailable' : `${file.pages} pages`}</span></div></PrintPagePreview>;
}

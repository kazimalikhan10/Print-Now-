import { useEffect, useMemo, useState } from 'react';
import PrintPagePreview from './PrintPagePreview';

function decodeXmlText(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const paragraphs = [...doc.getElementsByTagNameNS('*', 'p')];
  return paragraphs.map((p) => [...p.getElementsByTagNameNS('*', 't')].map((t) => t.textContent).join('')).join('\n');
}

async function extractDocxText(file) {
  if (!file?.arrayBuffer || typeof DecompressionStream === 'undefined') return '';
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 < bytes.length) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(bytes.slice(offset + 30, offset + 30 + nameLength));
    const dataStart = offset + 30 + nameLength + extraLength;
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    if (name === 'word/document.xml') {
      if (method === 0) return decodeXmlText(decoder.decode(data));
      if (method === 8) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return decodeXmlText(await new Response(stream).text());
      }
    }
    offset = dataStart + compressedSize;
  }
  return '';
}

export default function DocumentPreview({ file }) {
  const [docxText, setDocxText] = useState('');
  const isPdf = file.sourceFile?.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isDocx = file.sourceFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(file.name);
  const url = useMemo(() => file.sourceFile ? URL.createObjectURL(file.sourceFile) : null, [file.sourceFile]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    if (isDocx && file.sourceFile) {
      extractDocxText(file.sourceFile).then((text) => {
        if (!cancelled) setDocxText(text);
      }).catch(() => setDocxText(''));
    }
    return () => { cancelled = true; };
  }, [file.sourceFile, isDocx]);

  if (isPdf && url) {
    return (
      <PrintPagePreview file={file}>
        <iframe className={`pdf-preview-frame ${file.options.color === 'bw' ? 'preview-bw' : ''}`} title={`${file.name} preview`} src={`${url}#toolbar=0&navpanes=0`} />
      </PrintPagePreview>
    );
  }

  if (isDocx && docxText) {
    return (
      <PrintPagePreview file={file}>
        <div className={`docx-preview ${file.options.color === 'bw' ? 'preview-bw' : ''}`}>
          {docxText.split('\n').filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
        </div>
      </PrintPagePreview>
    );
  }

  return (
    <PrintPagePreview file={file}>
      <div className="document-preview-fallback">
        <strong>{file.name}</strong>
        <span>{file.type === 'document' ? `${file.pages} pages` : 'Preview unavailable'}</span>
      </div>
    </PrintPagePreview>
  );
}

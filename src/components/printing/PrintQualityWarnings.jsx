import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PrintQualityWarnings({ file }) {
  const [dimensions, setDimensions] = useState(null);
  useEffect(() => {
    if (file.type !== 'photo' || !file.preview) { setDimensions(null); return undefined; }
    const image = new Image();
    image.onload = () => setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = file.preview;
    return () => { image.onload = null; };
  }, [file.id, file.preview]);

  const warnings = [];
  if (file.type === 'photo' && dimensions) {
    const short = Math.min(dimensions.width, dimensions.height);
    if (short < 1000) warnings.push('This image is relatively small and may look soft at larger print sizes.');
    if (short < 600) warnings.push('Low resolution: consider a higher-quality original before printing.');
  }
  if (file.type === 'document' && file.options?.pageSelection === 'custom' && !file.options?.pageRange?.trim()) warnings.push('Choose the pages you want to print or select All Pages.');
  if (file.type === 'document' && Number(file.pages) > 0) return <div className="quality-panel ok"><CheckCircle2 size={17}/><div><strong>Print-ready document</strong><span>{file.pages} pages detected. The selected page count is used for pricing.</span></div></div>;
  if (!warnings.length) return <div className="quality-panel"><Info size={17}/><div><strong>Print quality check</strong><span>The original image is preserved and will be framed inside the selected paper.</span></div></div>;
  return <div className="quality-panel warning"><AlertTriangle size={17}/><div><strong>Check image quality</strong>{warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></div>;
}

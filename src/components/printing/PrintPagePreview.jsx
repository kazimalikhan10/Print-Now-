import { getPaperDimensions } from '../../utils/printPreview';

export default function PrintPagePreview({ file, children, className = '' }) {
  const paper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');

  return (
    <div
      className={`print-page-preview ${className}`.trim()}
      style={{ aspectRatio: `${paper.width} / ${paper.height}` }}
      data-paper={`${paper.width}x${paper.height}`}
    >
      {children}
      <div className="print-page-label">
        {file.options.paperSize || 'A4'} · {paper.width} × {paper.height} mm
      </div>
    </div>
  );
}

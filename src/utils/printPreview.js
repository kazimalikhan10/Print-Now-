export const PAPER_DIMENSIONS = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  '4 × 6': { width: 101.6, height: 152.4 },
  '5 × 7': { width: 127, height: 177.8 },
};

export function getPaperDimensions(size = 'A4', orientation = 'portrait') {
  const base = PAPER_DIMENSIONS[size] || PAPER_DIMENSIONS.A4;
  return orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { ...base };
}

export function getPhotoDimensions(file, sourceAspect = 1) {
  const width = Number(file?.options?.imageWidthMm);
  const height = Number(file?.options?.imageHeightMm);
  if (width > 0 && height > 0) return { width, height };

  const paper = getPaperDimensions(file?.options?.paperSize || 'A4', file?.options?.orientation || 'portrait');
  const maxWidth = paper.width * 0.85;
  const maxHeight = paper.height * 0.85;
  const aspect = sourceAspect > 0 ? sourceAspect : 1;
  const widthFromHeight = maxHeight * aspect;
  if (widthFromHeight <= maxWidth) return { width: widthFromHeight, height: maxHeight };
  return { width: maxWidth, height: maxWidth / aspect };
}

export function mmToPagePercent(mm, pageMm) {
  return (mm / pageMm) * 100;
}

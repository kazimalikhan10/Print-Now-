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
  const paper = getPaperDimensions(file?.options?.paperSize || 'A4', file?.options?.orientation || 'portrait');
  if ((file?.options?.photoLayout || 'single') === 'single') return { width: paper.width, height: paper.height };
  const width = Number(file?.options?.imageWidthMm);
  const height = Number(file?.options?.imageHeightMm);
  if (width > 0 && height > 0) return { width, height };

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

export function getPhotoSheetLayout(file) {
  const paper = getPaperDimensions(file?.options?.paperSize || 'A4', file?.options?.orientation || 'portrait');
  const mode = file?.options?.photoLayout || 'single';
  const quantity = Math.max(1, Number(file?.options?.photoQuantity || file?.options?.copies) || 1);
  if (mode === 'single') {
    return {
      paper, columns: 1, rows: 1, capacity: 1,
      imageWidth: paper.width, imageHeight: paper.height,
      rotated: false, mode, sheetsRequired: quantity,
    };
  }

  const width = Number(file?.options?.imageWidthMm ?? 35);
  const height = Number(file?.options?.imageHeightMm ?? 45);
  const margin = Math.max(0, Number(file?.options?.sheetMarginMm ?? 5) || 0);
  const gap = Math.max(0, Number(file?.options?.sheetGapMm ?? 3) || 0);
  const usableWidth = paper.width - margin * 2;
  const usableHeight = paper.height - margin * 2;
  const layouts = [];
  for (let columns = 1; columns <= quantity; columns += 1) {
    const rows = Math.ceil(quantity / columns);
    const totalWidth = columns * width + (columns - 1) * gap;
    const totalHeight = rows * height + (rows - 1) * gap;
    if (totalWidth <= usableWidth && totalHeight <= usableHeight) {
      layouts.push({ columns, rows, totalWidth, totalHeight, score: Math.abs(totalWidth / totalHeight - paper.width / paper.height) });
    }
  }
  layouts.sort((a, b) => a.score - b.score);
  const selected = layouts[0];
  if (!selected) return { paper, columns: 1, rows: quantity, capacity: 0, imageWidth: width, imageHeight: height, rotated: false, mode, sheetsRequired: quantity };
  return {
    paper, columns: selected.columns, rows: selected.rows, capacity: quantity,
    imageWidth: width, imageHeight: height, rotated: false, mode,
    totalWidth: selected.totalWidth, totalHeight: selected.totalHeight,
    sheetsRequired: 1,
  };
}

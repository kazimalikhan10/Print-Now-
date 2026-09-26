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
  if (mode === 'single') {
    return {
      paper,
      columns: 1,
      rows: 1,
      capacity: 1,
      imageWidth: paper.width,
      imageHeight: paper.height,
      rotated: false,
      mode,
      sheetsRequired: Math.max(1, Number(file?.options?.copies) || 1),
    };
  }

  const width = Number(file?.options?.imageWidthMm) || 0;
  const height = Number(file?.options?.imageHeightMm) || 0;
  if (width <= 0 || height <= 0) {
    return { paper, columns: 1, rows: 1, capacity: 1, imageWidth: width || 45, imageHeight: height || 45, rotated: false, mode, sheetsRequired: Math.max(1, Number(file?.options?.copies) || 1) };
  }

  const normalColumns = Math.floor(paper.width / width);
  const normalRows = Math.floor(paper.height / height);
  const rotatedColumns = Math.floor(paper.width / height);
  const rotatedRows = Math.floor(paper.height / width);
  const normalCapacity = Math.max(0, normalColumns * normalRows);
  const rotatedCapacity = Math.max(0, rotatedColumns * rotatedRows);
  const useRotated = rotatedCapacity > normalCapacity;
  const capacity = Math.max(1, useRotated ? rotatedCapacity : normalCapacity);
  return {
    paper,
    columns: useRotated ? rotatedColumns : normalColumns,
    rows: useRotated ? rotatedRows : normalRows,
    capacity,
    imageWidth: useRotated ? height : width,
    imageHeight: useRotated ? width : height,
    rotated: useRotated,
    mode,
    sheetsRequired: Math.max(1, Math.ceil((Number(file?.options?.copies) || 1) / capacity)),
  };
}

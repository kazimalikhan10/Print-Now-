const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PT = 72 / 25.4;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load the cropped photo to prepare the print sheet.')); };
    image.src = url;
  });
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the photo for the print PDF.')), 'image/jpeg', 0.96));
}

function bytesToBinary(bytes) {
  let result = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) result += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return result;
}

function makePdf(jpegBytes, imageWidth, imageHeight, placements) {
  const imageBinary = bytesToBinary(jpegBytes);
  const commands = placements.map(({ x, y, width, height }) => `q\n${(x * MM_TO_PT).toFixed(3)} ${(y * MM_TO_PT).toFixed(3)} ${(width * MM_TO_PT).toFixed(3)} ${(height * MM_TO_PT).toFixed(3)} re W n\n${(width * MM_TO_PT).toFixed(3)} 0 0 ${(height * MM_TO_PT).toFixed(3)} ${(x * MM_TO_PT).toFixed(3)} ${(y * MM_TO_PT).toFixed(3)} cm\n/Im0 Do\nQ`).join('\n');
  const stream = `q\n${commands}\nQ`;
  const streamLength = stream.length;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${(A4_WIDTH_MM * MM_TO_PT).toFixed(3)} ${(A4_HEIGHT_MM * MM_TO_PT).toFixed(3)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n${imageBinary}\nendstream`,
    `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n%PRINTNOW\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

export async function createPhotoSheetPdf(photoFile, options = {}) {
  if (!photoFile) throw new Error('The cropped photo is missing. Please crop it again.');
  const quantity = Number(options.photoQuantity || 6);
  const width = Number(options.imageWidthMm ?? 35);
  const height = Number(options.imageHeightMm ?? 45);
  const margin = Number(options.sheetMarginMm ?? 5);
  const gap = Number(options.sheetGapMm ?? 3);
  if (![6, 12].includes(quantity)) throw new Error('Choose either 6 or 12 photos per sheet.');
  if (![width, height, margin, gap].every(Number.isFinite) || width <= 0 || height <= 0 || margin < 0 || gap < 0) throw new Error('Enter valid photo dimensions, margin and spacing in millimetres.');

  const usableWidth = A4_WIDTH_MM - margin * 2;
  const usableHeight = A4_HEIGHT_MM - margin * 2;
  const layouts = [];
  for (let columns = 1; columns <= quantity; columns += 1) {
    const rows = Math.ceil(quantity / columns);
    const totalWidth = columns * width + (columns - 1) * gap;
    const totalHeight = rows * height + (rows - 1) * gap;
    if (totalWidth <= usableWidth + 0.001 && totalHeight <= usableHeight + 0.001) {
      layouts.push({ columns, rows, totalWidth, totalHeight, score: Math.abs(totalWidth / totalHeight - A4_WIDTH_MM / A4_HEIGHT_MM) });
    }
  }
  if (!layouts.length) throw new Error(`A ${width} × ${height} mm photo does not fit ${quantity} times on A4 with the current margin and spacing. Reduce the size or spacing.`);
  layouts.sort((a, b) => a.score - b.score);
  const layout = layouts[0];
  const startX = (A4_WIDTH_MM - layout.totalWidth) / 2;
  const startY = (A4_HEIGHT_MM - layout.totalHeight) / 2;
  const placements = Array.from({ length: quantity }, (_, index) => ({
    x: startX + (index % layout.columns) * (width + gap),
    // PDF origin is bottom-left; convert the top-down sheet position.
    y: A4_HEIGHT_MM - startY - height - Math.floor(index / layout.columns) * (height + gap),
    width,
    height,
  }));

  const image = await loadImage(photoFile);
  const targetAspect = width / height;
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (sourceAspect > targetAspect) sourceWidth = Math.max(1, Math.round(image.naturalHeight * targetAspect));
  else sourceHeight = Math.max(1, Math.round(image.naturalWidth / targetAspect));
  const sx = (image.naturalWidth - sourceWidth) / 2;
  const sy = (image.naturalHeight - sourceHeight) / 2;
  // 300 DPI output keeps the physical photo dimensions sharp without embedding an unnecessarily huge original image.
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((width / 25.4) * 300));
  canvas.height = Math.max(1, Math.round((height / 25.4) * 300));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the print sheet.');
  context.drawImage(image, sx, sy, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  const blob = await canvasBlob(canvas);
  const jpegBytes = new Uint8Array(await blob.arrayBuffer());
  const pdfBlob = makePdf(jpegBytes, canvas.width, canvas.height, placements);
  const baseName = (photoFile.name || 'photo').replace(/\.[^.]+$/, '').replace(/-cropped$/, '') || 'photo';
  return new File([pdfBlob], `${baseName}-${quantity}-photos-A4.pdf`, { type: 'application/pdf', lastModified: Date.now() });
}

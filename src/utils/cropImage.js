const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image for cropping. Please choose the image again.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not export the cropped image. Please try again.'));
    }, type, quality);
  });
}

/** Export the visible crop from PhotoPrintPreview as a real uploadable image file. */
export async function createCroppedPhotoFile(sourceFile, options = {}) {
  if (!sourceFile) throw new Error('The original photo is unavailable. Please remove it and upload it again.');

  const image = await loadImage(sourceFile);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) throw new Error('This image has invalid dimensions and cannot be cropped.');

  const rotation = ((Number(options.rotation) || 0) % 360 + 360) % 360;
  const normalizedRotation = [0, 90, 180, 270].includes(rotation) ? rotation : 0;
  const rotatedWidth = normalizedRotation === 90 || normalizedRotation === 270 ? height : width;
  const rotatedHeight = normalizedRotation === 90 || normalizedRotation === 270 ? width : height;

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  const rotatedContext = rotatedCanvas.getContext('2d');
  if (!rotatedContext) throw new Error('Your browser could not prepare the image for cropping.');
  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate((normalizedRotation * Math.PI) / 180);
  rotatedContext.drawImage(image, -width / 2, -height / 2, width, height);

  const rect = options.crop?.rect || { left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 };
  const left = clamp(Number(rect.left) || 0, 0, 1);
  const top = clamp(Number(rect.top) || 0, 0, 1);
  const right = clamp(Number(rect.right) || 1, left + 0.01, 1);
  const bottom = clamp(Number(rect.bottom) || 1, top + 0.01, 1);
  const zoom = clamp(Number(options.crop?.zoom) || 1, 1, 3);

  // The editor scales the rotated image around the center of its stage.
  const sx = clamp((0.5 + (left - 0.5) / zoom) * rotatedWidth, 0, rotatedWidth - 1);
  const sy = clamp((0.5 + (top - 0.5) / zoom) * rotatedHeight, 0, rotatedHeight - 1);
  const sw = clamp(((right - left) / zoom) * rotatedWidth, 1, rotatedWidth - sx);
  const sh = clamp(((bottom - top) / zoom) * rotatedHeight, 1, rotatedHeight - sy);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = Math.max(1, Math.round(sw));
  outputCanvas.height = Math.max(1, Math.round(sh));
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) throw new Error('Your browser could not export the cropped image.');
  outputContext.drawImage(rotatedCanvas, sx, sy, sw, sh, 0, 0, outputCanvas.width, outputCanvas.height);

  const isPng = sourceFile.type === 'image/png';
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(outputCanvas, mimeType, isPng ? undefined : 0.94);
  const originalName = sourceFile.name || 'photo';
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'photo';
  const extension = isPng ? 'png' : 'jpg';
  return new File([blob], `${baseName}-cropped.${extension}`, { type: mimeType, lastModified: Date.now() });
}

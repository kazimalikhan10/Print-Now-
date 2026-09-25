export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export function formatBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function getFileType(file) {
  return file.type.startsWith('image/') ? 'photo' : 'document';
}

export function isSupportedFile(file) {
  return ACCEPTED_FILE_TYPES.includes(file.type);
}

export function validateFiles(files) {
  const valid = [];
  const errors = [];

  files.forEach((file) => {
    if (!isSupportedFile(file)) {
      errors.push(`${file.name}: this file type isn't supported.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: files must be 20 MB or smaller.`);
      return;
    }
    valid.push(file);
  });

  return { valid, errors };
}

export function getSelectedPageCount(file) {
  if (!file || file.type !== 'document') return 1;

  const totalPages = Math.max(1, Number(file.pages) || 1);
  if (file.options?.pageSelection !== 'custom') return totalPages;

  const raw = String(file.options?.pageRange || '');
  const selected = new Set();

  raw.split(',').forEach((part) => {
    const value = part.trim();
    if (!value) return;

    const range = value.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Math.max(1, Math.min(totalPages, Number(range[1])));
      const end = Math.max(1, Math.min(totalPages, Number(range[2])));
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      for (let page = low; page <= high; page += 1) selected.add(page);
      return;
    }

    const page = Number(value);
    if (Number.isInteger(page) && page >= 1 && page <= totalPages) selected.add(page);
  });

  return selected.size || 0;
}

export function getFilePrintCost(file, pricing) {
  const { options } = file;
  const copies = options?.copies || 1;

  const rates = pricing || {
    paper: {
      A4: { bwSingle: 2, bwDouble: 3, colorSingle: 8, colorDouble: 12 },
      A5: { bwSingle: 1.5, bwDouble: 2, colorSingle: 5, colorDouble: 7 },
      A6: { bwSingle: 1, bwDouble: 1.5, colorSingle: 3, colorDouble: 4 },
      A3: { bwSingle: 5, bwDouble: 7, colorSingle: 15, colorDouble: 20 },
    },
    photos: { '4 × 6': 10, '5 × 7': 15, A6: 12, A5: 18, A4: 25, A3: 50 },
  };

  if (file.type === 'photo') {
    return (rates.photos[options.paperSize] || rates.photos.A4) * copies;
  }

  const paper = rates.paper[options.paperSize] || rates.paper.A4;
  const rateKey = `${options.color === 'color' ? 'color' : 'bw'}${options.sides === 'double' ? 'Double' : 'Single'}`;
  return Math.round(getSelectedPageCount(file) * copies * (paper[rateKey] || paper.bwSingle));
}

export function getOrderTotals(files, pricing) {
  const totalPages = files.reduce((sum, file) => sum + getSelectedPageCount(file), 0);
  const totalCopies = files.reduce((sum, file) => {
    const copies = file.options?.copies || 1;
    return sum + getSelectedPageCount(file) * copies;
  }, 0);
  const total = files.reduce((sum, file) => sum + getFilePrintCost(file, pricing), 0);

  return { totalPages, totalCopies, total };
}

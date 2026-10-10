import { createFile } from '../data/mockData';
import { getFileType, validateFiles } from '../utils';
import { getPdfPageCount } from './pdf';

export async function prepareSelectedFiles(fileList) {
  const { valid, errors } = validateFiles(Array.from(fileList || []));
  const files = await Promise.all(valid.map(async (file) => {
    const type = getFileType(file);
    const pages = type === 'document' && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))
      ? await getPdfPageCount(file)
      : 1;
    return createFile({
      name: file.name,
      type,
      size: file.size,
      pages,
      preview: type === 'photo' ? URL.createObjectURL(file) : null,
      sourceFile: file,
    });
  }));
  return { files, errors };
}

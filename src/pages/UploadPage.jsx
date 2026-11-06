import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import FileUpload from '../components/files/FileUpload';
import { useOrder } from '../context/OrderContext';
import { createFile } from '../data/mockData';
import { validateFiles, getFileType } from '../utils';
import { getPdfPageCount } from '../utils/pdf';
import { isApiConfigured, uploadFileToBackend } from '../services/apiService';

export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFiles } = useOrder();
  const [errors, setErrors] = useState([]);
  const [countingPages, setCountingPages] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);

  const handleFiles = async (files) => {
    const { valid, errors: validationErrors } = validateFiles(files);
    const nextErrors = [...validationErrors];
    setErrors(nextErrors);
    if (!valid.length) return;
    if (!isApiConfigured()) {
      setErrors(['Backend URL is not configured. Create a .env file with VITE_API_BASE_URL and restart the frontend.']);
      return;
    }

    setUploadFiles(valid);
    setCountingPages(true);
    const mapped = [];
    try {
      for (const file of valid) {
        try {
          const type = getFileType(file);
          let pages = 1;
          if (type === 'document' && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
            try { pages = await getPdfPageCount(file); } catch { pages = 1; }
          }
          // Photos stay local until the user confirms the crop. Only the cropped bytes are uploaded.
          const backendFile = type === 'photo' ? null : await uploadFileToBackend(file);
          mapped.push({
            ...createFile({
              name: file.name,
              type,
              size: file.size,
              pages: Number(backendFile?.analysis?.pageCount) || pages,
              preview: type === 'photo' ? URL.createObjectURL(file) : null,
              sourceFile: file,
              backendFileId: backendFile?.id || null,
              backendFileStatus: backendFile?.status || null,
              backendValidation: backendFile?.validation || null,
              backendAnalysis: backendFile?.analysis || null,
            }),
            configured: type !== 'photo',
          });
        } catch (error) {
          nextErrors.push(error?.message || `Could not upload ${file.name}.`);
        }
      }
      setErrors(nextErrors);
      if (mapped.length) {
        addFiles(mapped);
        navigate('/checkout', { state: nextErrors.length ? { uploadErrors: nextErrors } : {} });
      }
    } finally {
      setCountingPages(false);
      setUploadFiles([]);
    }
  };

  return (
    <>
      <Header showBack onBack={() => navigate('/')} />
      <PageShell>
        <div className="mb-6 mt-[10px]">
          <h1 className="my-[5px] mb-[7px] text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-[1.1] tracking-[-.045em] text-[#171a24]">Upload Files</h1>
          <p className="m-0 text-[.92rem] leading-[1.5] text-[#70778a]">Choose PDF documents or JPG/PNG photos. Documents upload immediately; photos are uploaded after you confirm the crop.</p>
        </div>
        <FileUpload onFiles={handleFiles} errors={errors} uploading={countingPages} uploadFiles={uploadFiles} disabled={countingPages} openPicker={location.state?.openPicker || null} />
        {countingPages && <p className="mt-3 text-[.7rem] leading-[1.45] text-[#70778a]">Preparing files and checking backend validation… Photos upload after crop confirmation.</p>}
      </PageShell>
    </>
  );
}

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import FileUpload from '../components/files/FileUpload';
import { useOrder } from '../context/OrderContext';
import { createFile } from '../data/mockData';
import { validateFiles, getFileType } from '../utils';
import { getPdfPageCount } from '../utils/pdf';

export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFiles } = useOrder();
  const [errors, setErrors] = useState([]);
  const [countingPages, setCountingPages] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);

  const handleFiles = async (files) => {
    const { valid, errors: validationErrors } = validateFiles(files);
    setErrors(validationErrors);
    if (!valid.length) return;

    setUploadFiles(valid);
    setCountingPages(true);
    try {
      const mapped = await Promise.all(valid.map(async (file) => {
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

      addFiles(mapped);
      navigate('/checkout');
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
          <p className="m-0 text-[.92rem] leading-[1.5] text-[#70778a]">Choose the documents or photos you want to print.</p>
        </div>
        <FileUpload onFiles={handleFiles} errors={errors} uploading={countingPages} uploadFiles={uploadFiles} disabled={countingPages} openPicker={location.state?.openPicker || null} />
        {countingPages && <p className="mt-3 text-[.7rem] leading-[1.45] text-[#70778a]">Preparing document details…</p>}
      </PageShell>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import FileUpload from '../components/files/FileUpload';
import { useOrder } from '../context/OrderContext';
import { createFile } from '../data/mockData';
import { validateFiles, getFileType } from '../utils';
import { getPdfPageCount } from '../utils/pdf';
import StepIndicator from '../components/ui/StepIndicator';

export default function UploadPage() {
  const navigate = useNavigate();
  const { addFiles } = useOrder();
  const [errors, setErrors] = useState([]);
  const [countingPages, setCountingPages] = useState(false);

  const handleFiles = async (files) => {
    const { valid, errors: validationErrors } = validateFiles(files);
    setErrors(validationErrors);
    if (!valid.length) return;

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
      navigate('/files');
    } finally {
      setCountingPages(false);
    }
  };

  return (
    <>
      <Header showBack onBack={() => navigate('/')} />
      <PageShell>
        <StepIndicator current={2} />
        <div className="page-intro">
          <span className="step-label">STEP 1 OF 5</span>
          <h1>Upload Files</h1>
          <p>Choose the documents or photos you want to print.</p>
        </div>
        <FileUpload onFiles={handleFiles} errors={errors} />
        {countingPages && <p className="upload-processing-note">Reading document page counts…</p>}
      </PageShell>
    </>
  );
}

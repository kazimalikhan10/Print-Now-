import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import FileCard from '../components/files/FileCard';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import SectionTitle from '../components/ui/SectionTitle';
import { useOrder } from '../context/OrderContext';

export default function FilesPage() {
  const navigate = useNavigate();
  const { order, removeFile } = useOrder();
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured);

  return (
    <>
      <Header showBack onBack={() => navigate('/upload')} />
      <PageShell>
        <StepIndicator current={3} />
        <SectionTitle
          title="Your Files"
          subtitle="Configure each file before placing your order."
          action={<span className="count-pill">{order.files.length} files</span>}
        />

        <div className="file-list">
          {order.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => removeFile(file.id)}
              onConfigure={() => navigate(`/configure/${file.id}`)}
            />
          ))}
        </div>

        <button className="add-files-button" onClick={() => navigate('/upload')}>
          <Plus size={19} /> Add More Files
        </button>

        {order.files.length > 0 && (
          <div className="files-page-actions">
          <Button
            className="bottom-cta"
            onClick={() => {
              const nextFile = order.files.find((file) => !file.configured);
              navigate(nextFile ? `/configure/${nextFile.id}` : '/summary');
            }}
          >
            {allConfigured ? 'Review Order' : 'Continue'}
          </Button>
          </div>
        )}
      </PageShell>
    </>
  );
}

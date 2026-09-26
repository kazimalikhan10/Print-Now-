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

        <div className="flex flex-col gap-2.5">
          {order.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => removeFile(file.id)}
              onConfigure={() => navigate(`/configure/${file.id}`)}
            />
          ))}
        </div>

        <button className="mt-[13px] flex min-h-12 w-full items-center justify-center gap-[7px] rounded-[14px] border border-dashed border-[#aaa6ff] bg-[#fbfbff] font-[650] text-[#4b43e5] transition hover:border-[#8580f5] hover:bg-[#f5f4ff]" onClick={() => navigate('/upload')}>
          <Plus size={19} /> Add More Files
        </button>

        {order.files.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-[560px]">
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

import { ArrowLeft, FileText, Image as ImageIcon, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';
import { getFilePrintCost, getOrderTotals, getSelectedPageCount } from '../utils';

function formatOptions(file) {
  const { options } = file;
  const color = options.color === 'bw' ? 'B&W' : 'Colour';
  if (file.type === 'photo') return `${options.paperSize} · ${color} · ${options.copies} copies`;
  return `${options.paperSize} · ${color} · ${options.sides === 'double' ? 'Double-sided' : 'Single-sided'} · ${options.copies} copies`;
}

export default function SummaryPage() {
  const navigate = useNavigate();
  const { order, pricing } = useOrder();
  const totals = getOrderTotals(order.files, pricing);
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured);

  if (!order.files.length) { navigate('/upload'); return null; }
  if (!allConfigured) { navigate('/files'); return null; }

  return (
    <>
      <Header showBack onBack={() => navigate('/files')} />
      <PageShell>
<div className="mb-[18px] mt-[10px]">
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">ORDER SUMMARY</span>
          <h1 className="my-[5px] mb-[7px] text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-[1.1] tracking-[-.045em] text-[#171a24]">Review your print</h1>
          <p className="m-0 text-[.92rem] leading-[1.5] text-[#70778a]">Everything looks right? You can still edit any file before continuing.</p>
        </div>

        <div className="mx-auto flex max-w-[560px] flex-col gap-2.5 min-[700px]:gap-3">
          {order.files.map((file) => (
            <div className="flex gap-3 rounded-2xl border border-[#e7e8ef] bg-white p-3.5 shadow-[0_5px_18px_rgba(28,31,57,.035)]" key={file.id}>
              <div className={`grid h-[46px] w-[42px] flex-none place-items-center rounded-[11px] ${file.type === 'photo' ? 'bg-[#eef0ff] text-[#4a43e8]' : 'bg-[#fff0f0] text-[#e33e3e]'}`}>
                {file.type === 'photo' ? <ImageIcon size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[.82rem]">{file.name}</strong>
                  <button className="inline-flex flex-none items-center gap-1 border-0 bg-transparent p-1 text-[.68rem] font-[650] text-[#4a43e8]" onClick={() => navigate(`/configure/${file.id}`)}>
                    <Pencil size={14} /> Edit
                  </button>
                </div>
                <span className="mt-[5px] block text-[.67rem] leading-[1.45] text-[#72798a]">{file.type === 'photo' ? '1 image' : `${getSelectedPageCount(file)} of ${file.pages} pages selected`} · {formatOptions(file)}</span>
                <div className="mt-[9px] text-[.82rem] font-bold">₹{getFilePrintCost(file, pricing)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-[13px] max-w-[560px] rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div className="flex items-center justify-between py-[7px] text-[.75rem] text-[#72798a]"><span>Total pages</span><strong className="text-[#161b27]">{totals.totalPages}</strong></div>
          <div className="flex items-center justify-between py-[7px] text-[.75rem] text-[#72798a]"><span>Total copies</span><strong className="text-[#161b27]">{totals.totalCopies}</strong></div>{totals.totalPhotoSheets > 0 && <div className="flex items-center justify-between py-[7px] text-[.75rem] text-[#72798a]"><span>Photo sheets</span><strong className="text-[#161b27]">{totals.totalPhotoSheets}</strong></div>}
          <div className="mt-[6px] flex items-center justify-between border-t border-[#edf0f4] pt-[13px] text-[.84rem] text-[#161b27]"><span>Estimated total</span><strong className="text-[1.2rem]">₹{totals.total}</strong></div>
        </div>

        <div className="mx-auto mt-7 w-full max-w-[560px]">
          <Button className="w-full" onClick={() => navigate('/payment')}>Continue to payment</Button>
          <button className="mx-auto mt-2.5 flex items-center justify-center gap-1.5 border-0 bg-transparent p-[7px] text-[.74rem] text-[#555d70]" onClick={() => navigate('/files')}><ArrowLeft size={15} /> Back to files</button>
        </div>
      </PageShell>
    </>
  );
}

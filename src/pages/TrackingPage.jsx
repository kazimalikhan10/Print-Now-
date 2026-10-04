import { AlertTriangle, Check, Clipboard, Clock3, Printer, PackageCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';

const steps = [
  { key: 'submitted', label: 'Submitted', description: 'Your print request has been received.', icon: Check },
  { key: 'processing', label: 'Processing', description: 'Your files are being prepared.', icon: Clock3 },
  { key: 'printing', label: 'Printing', description: 'Your print job is currently being printed.', icon: Printer },
  { key: 'ready', label: 'Ready for Collection', description: 'Your prints are ready for collection.', icon: PackageCheck },
  { key: 'completed', label: 'Completed', description: 'This order has been completed.', icon: Check },
];

export default function TrackingPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { order, orders } = useOrder();
  const submittedOrder = orders.find((item) => item.id === jobId);
  const shop = submittedOrder?.shop || order.shop;
  const trackedFiles = submittedOrder?.files || [];
  const currentStatus = submittedOrder?.status || order.job.status || 'submitted';
  const statusIndex = Math.max(0, steps.findIndex((step) => step.key === currentStatus));
  const isActionRequired = currentStatus === 'action_required';
  const isCancelled = currentStatus === 'cancelled';
  const totals = { totalPages: submittedOrder?.pages || 0, totalCopies: trackedFiles.reduce((sum, file) => sum + (Number(file.copies) || 1), 0) };
  const [copied, setCopied] = useState(false);

  const copyJobId = async () => {
    try { 
      await navigator.clipboard?.writeText(jobId);
      setCopied(true); 
      window.setTimeout(() => setCopied(false), 1600); 
    } catch { setCopied(false); }
  };

  return (
    <>
      <Header />
      <PageShell>
        <div className="mx-auto max-w-[560px] px-2 py-2.5 text-center">
          <div className={`pn-tracking-success mx-auto mb-3 grid h-[70px] w-[70px] place-items-center rounded-full bg-[#e7f8ee] text-[#149548] ${currentStatus === 'submitted' ? 'is-new' : ''}`}><Check size={30} /></div>
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">PRINT JOB SUBMITTED</span>
          <h1 className="my-[5px] mb-[7px] text-[1.45rem] font-semibold leading-[1.1] tracking-[-.04em]">{isCancelled ? 'This print job was cancelled.' : isActionRequired ? 'Your print job needs attention.' : currentStatus === 'completed' ? 'Your print job is complete.' : 'Your files are on their way.'}</h1>
          <p className="m-0 text-[.76rem] leading-[1.5] text-[#70778a]">{isCancelled ? 'This print request was cancelled.' : isActionRequired ? 'The shop needs your attention before printing can continue.' : `We sent your print request to ${shop.name}.`}</p>
        </div>

        <div className="mx-auto mt-2 flex max-w-[560px] items-center justify-between gap-3 rounded-[15px] border border-[#e6e8ef] bg-white p-3.5 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div><span className="block text-[.65rem] text-[#7a8190]">Job ID</span><strong className="mt-[3px] block text-[.92rem] tracking-[.02em]">{jobId}</strong></div>
          <button className={`inline-flex h-[38px] min-w-[82px] items-center justify-center gap-1.5 rounded-[10px] border px-2.5 text-[.65rem] font-semibold ${copied ? 'border-[#bfe7cc] bg-[#f5fcf7] text-[#168b4b]' : 'border-[#e1e3ea] bg-white text-[#4a43e8]'}`} aria-label={copied ? 'Job ID copied' : 'Copy job ID'} onClick={copyJobId}>
            {copied ? <Check size={17} /> : <Clipboard size={17} />}<span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="mx-auto mt-[11px] max-w-[560px] rounded-2xl border border-[#e6e8ef] bg-white p-[17px] shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          {isActionRequired ? (
            <div className="flex gap-[11px]"><div className="relative z-[2] grid h-[27px] w-[27px] flex-none place-items-center rounded-full border border-[#d9dce5] bg-white text-[#8a91a0]"><AlertTriangle size={15}/></div><div className="pt-px"><strong className="block text-[.75rem]">Action required</strong><span className="mt-[3px] block text-[.65rem] leading-[1.4] text-[#7b8291]">{submittedOrder?.actionRequired || 'Please contact the shop for the next step.'}</span></div></div>
          ) : isCancelled ? (
            <div className="flex gap-[11px]"><div className="relative z-[2] grid h-[27px] w-[27px] flex-none place-items-center rounded-full border border-[#d9dce5] bg-white text-[#8a91a0]"><AlertTriangle size={15}/></div><div className="pt-px"><strong className="block text-[.75rem]">Order cancelled</strong><span className="mt-[3px] block text-[.65rem] leading-[1.4] text-[#7b8291]">The shop cancelled this print request.</span></div></div>
          ) : steps.map((step, index) => {
            const Icon = step.icon;
            const isDone = index < statusIndex;
            const isCurrent = index === statusIndex;
            return (
              <div className="relative flex min-h-[68px] gap-[11px]" key={step.key}>
                <div className={`relative z-[2] grid h-[27px] w-[27px] flex-none place-items-center rounded-full border ${isDone ? 'border-[#9cdbb5] bg-[#e8f8ef] text-[#16934a]' : isCurrent ? 'border-[#aaa6ff] bg-[#eeedff] text-[#4a43e8]' : 'border-[#d9dce5] bg-white text-[#8a91a0]'}`}><Icon size={15} /></div>
                <div className="pt-px"><strong className="block text-[.75rem]">{step.label}</strong><span className="mt-[3px] block text-[.65rem] leading-[1.4] text-[#7b8291]">{isCurrent ? 'In progress' : step.description}</span></div>
                {index < steps.length - 1 && <div className={`absolute bottom-0 left-[13px] top-[27px] z-[1] w-px ${isDone ? 'bg-[#9fd7b6]' : 'bg-[#dfe2e9]'}`} />}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-[11px] grid max-w-[560px] grid-cols-3 gap-2">
          <div className="rounded-[13px] border border-[#e7e9f0] bg-white p-3 text-center"><span className="block text-[.62rem] text-[#7d8492]">Files</span><strong className="mt-1 block text-[.82rem]">{trackedFiles.length}</strong></div>
          <div className="rounded-[13px] border border-[#e7e9f0] bg-white p-3 text-center"><span className="block text-[.62rem] text-[#7d8492]">Pages</span><strong className="mt-1 block text-[.82rem]">{totals.totalPages}</strong></div>
          <div className="rounded-[13px] border border-[#e7e9f0] bg-white p-3 text-center"><span className="block text-[.62rem] text-[#7d8492]">Copies</span><strong className="mt-1 block text-[.82rem]">{totals.totalCopies}</strong></div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[560px]"><Button className="w-full" onClick={() => navigate('/')}>Done</Button></div>
      </PageShell>
    </>
  );
}

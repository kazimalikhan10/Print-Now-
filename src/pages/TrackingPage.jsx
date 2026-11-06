import { AlertTriangle, Check, Clipboard, Clock3, Printer, PackageCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder, mapBackendJobStatus } from '../context/OrderContext';
import { api, getBackendPrintJob, isApiConfigured } from '../services/apiService';

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
  const [backendJob, setBackendJob] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [backendPayment, setBackendPayment] = useState(null);
  const shop = submittedOrder?.shop || order.shop;
  const trackedFiles = submittedOrder?.files || [];
  const currentStatus = backendJob?.status ? mapBackendJobStatus(backendJob.status) : (submittedOrder?.status || order.job.status || 'submitted');
  const backendStatus = String(backendJob?.status || order.job.backendStatus || '').toUpperCase();
  const paymentStatus = String(backendPayment?.status || (submittedOrder?.paymentStatus === 'paid' ? 'SUCCESSFUL' : submittedOrder?.paymentMethod === 'shop' ? 'AWAITING_APPROVAL' : submittedOrder?.paymentId ? 'PENDING' : '')).toUpperCase();
  const paymentIsSuccessful = paymentStatus === 'SUCCESSFUL';
  const paymentIsCashPending = paymentStatus === 'AWAITING_APPROVAL';
  const paymentIsRejected = ['REJECTED', 'FAILED', 'CANCELLED'].includes(paymentStatus);

  useEffect(() => {
    if (!isApiConfigured() || !jobId) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const result = await getBackendPrintJob(jobId);
        if (active) { setBackendJob(result); setTrackingError(''); }
      } catch (error) {
        if (active) setTrackingError(error?.message || 'Could not refresh job status from the backend.');
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [jobId]);

  useEffect(() => {
    const paymentId = submittedOrder?.paymentId;
    if (!isApiConfigured() || !paymentId) return undefined;
    let active = true;
    const refreshPayment = async () => {
      try {
        const payment = await api.payments.get(paymentId);
        if (!active) return;
        setBackendPayment(payment);
      } catch (error) {
        if (active) setTrackingError(error?.message || 'Could not refresh payment status.');
      }
    };
    void refreshPayment();
    const timer = window.setInterval(refreshPayment, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [jobId, submittedOrder?.paymentId]);

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
          <h1 className="my-[5px] mb-[7px] text-[1.45rem] font-semibold leading-[1.1] tracking-[-.04em]">{isCancelled ? 'This print job was cancelled.' : isActionRequired ? 'Your print job needs attention.' : currentStatus === 'completed' ? 'Your print job is complete.' : paymentIsSuccessful ? 'Payment confirmed!' : paymentIsCashPending ? 'Order placed — pay at shop' : paymentStatus === 'PENDING' ? 'Payment confirmation pending' : paymentIsRejected ? 'Payment needs attention' : 'Your files are on their way.'}</h1>
          <p className="m-0 text-[.76rem] leading-[1.5] text-[#70778a]">{isCancelled ? 'This print request was cancelled.' : isActionRequired ? 'The backend reported a processing failure. Please contact the shop.' : paymentIsSuccessful ? 'Your payment is verified by the backend. The shop can now process and queue your print job.' : paymentIsCashPending ? 'Your print request is created. Please pay in cash at the shop; payment will be confirmed by the shop team.' : paymentStatus === 'PENDING' ? 'We are waiting for the payment provider to confirm your payment. If money was deducted, do not pay again.' : paymentIsRejected ? 'The payment was not approved. Please contact the shop before making another payment.' : trackingError ? 'Showing the saved job details while live status refresh is unavailable.' : `We are checking the print job status from the backend for ${shop.name}.`}</p>
        </div>

        <div className="mx-auto mt-2 flex max-w-[560px] items-center justify-between gap-3 rounded-[15px] border border-[#e6e8ef] bg-white p-3.5 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div><span className="block text-[.65rem] text-[#7a8190]">Job ID</span><strong className="mt-[3px] block text-[.92rem] tracking-[.02em]">{jobId}</strong></div>
          <button className={`inline-flex h-[38px] min-w-[82px] items-center justify-center gap-1.5 rounded-[10px] border px-2.5 text-[.65rem] font-semibold ${copied ? 'border-[#bfe7cc] bg-[#f5fcf7] text-[#168b4b]' : 'border-[#e1e3ea] bg-white text-[#4a43e8]'}`} aria-label={copied ? 'Job ID copied' : 'Copy job ID'} onClick={copyJobId}>
            {copied ? <Check size={17} /> : <Clipboard size={17} />}<span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {backendStatus && <div className="mx-auto mt-[11px] max-w-[560px] rounded-xl border border-[#e6e8ef] bg-white px-3 py-2 text-xs text-[#646c80]">Print job: <strong className="text-[#171a24]">{paymentIsSuccessful && backendStatus === 'PAYMENT_REQUIRED' ? 'Awaiting shop queue' : backendStatus.replaceAll('_', ' ')}</strong>{backendJob?.pricing?.totalAmount != null && <span> · Server total: ₹{backendJob.pricing.totalAmount}</span>}</div>}
        {submittedOrder?.paymentId && <div className="mx-auto mt-2 max-w-[560px] rounded-xl border border-[#e6e8ef] bg-white px-3 py-3 text-xs text-[#646c80]"><div className="flex items-center justify-between gap-3"><span>Payment status</span><strong className={paymentIsSuccessful ? 'text-[#168b4b]' : paymentIsCashPending ? 'text-[#9a5b13]' : 'text-[#4b43e8]'}>{paymentStatus ? paymentStatus.replaceAll('_', ' ') : 'Checking…'}</strong></div>{backendPayment?.amount != null && <div className="mt-1 flex items-center justify-between"><span>Payment amount</span><strong className="text-[#171a24]">₹{backendPayment.amount}</strong></div>}</div>}
        {trackingError && <p role="status" className="mx-auto mt-2 max-w-[560px] rounded-xl bg-[#fff8e7] p-3 text-xs text-[#8a5a00]">{trackingError}</p>}

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

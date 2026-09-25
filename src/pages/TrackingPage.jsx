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
  const totals = {
    totalPages: submittedOrder?.pages || 0,
    totalCopies: trackedFiles.reduce((sum, file) => sum + (Number(file.copies) || 1), 0),
  };
  const [copied, setCopied] = useState(false);

  const copyJobId = async () => {
    try {
      await navigator.clipboard?.writeText(jobId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Header />
      <PageShell>
        <div className="tracking-success">
          <div className="success-icon"><Check size={30} /></div>
          <span className="eyebrow">PRINT JOB SUBMITTED</span>
          <h1>{isCancelled ? 'This print job was cancelled.' : isActionRequired ? 'Your print job needs attention.' : currentStatus === 'completed' ? 'Your print job is complete.' : 'Your files are on their way.'}</h1>
          <p>{isCancelled ? 'This print request was cancelled.' : isActionRequired ? 'The shop needs your attention before printing can continue.' : `We sent your print request to ${shop.name}.`}</p>
        </div>

        <div className="job-id-card">
          <div><span>Job ID</span><strong>{jobId}</strong></div>
          <button className={`copy-job-button ${copied ? 'copied' : ''}`} aria-label={copied ? 'Job ID copied' : 'Copy job ID'} onClick={copyJobId}>
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="tracking-card">
          {isActionRequired ? (
            <div className="tracking-alert-state"><div className="tracking-marker"><AlertTriangle size={15}/></div><div className="tracking-copy"><strong>Action required</strong><span>{submittedOrder?.actionRequired || 'Please contact the shop for the next step.'}</span></div></div>
          ) : isCancelled ? (
            <div className="tracking-alert-state"><div className="tracking-marker"><AlertTriangle size={15}/></div><div className="tracking-copy"><strong>Order cancelled</strong><span>The shop cancelled this print request.</span></div></div>
          ) : steps.map((step, index) => {
            const Icon = step.icon;
            const isDone = index < statusIndex;
            const isCurrent = index === statusIndex;
            return (
              <div className={`tracking-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`} key={step.key}>
                <div className="tracking-marker"><Icon size={15} /></div>
                <div className="tracking-copy"><strong>{step.label}</strong><span>{isCurrent ? 'In progress' : step.description}</span></div>
                {index < steps.length - 1 && <div className="tracking-line" />}
              </div>
            );
          })}
        </div>

        <div className="tracking-details">
          <div><span>Files</span><strong>{trackedFiles.length}</strong></div>
          <div><span>Pages</span><strong>{totals.totalPages}</strong></div>
          <div><span>Copies</span><strong>{totals.totalCopies}</strong></div>
        </div>

        <Button className="bottom-cta" onClick={() => navigate('/')}>Done</Button>
      </PageShell>
    </>
  );
}

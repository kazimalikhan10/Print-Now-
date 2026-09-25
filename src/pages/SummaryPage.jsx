import { ArrowLeft, Check, FileText, Image as ImageIcon, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
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

  if (!order.files.length) {
    navigate('/upload');
    return null;
  }

  if (!allConfigured) {
    navigate('/files');
    return null;
  }

  return (
    <>
      <Header showBack onBack={() => navigate('/files')} />
      <PageShell>
        <StepIndicator current={4} />
        <div className="page-intro compact">
          <span className="step-label">ORDER SUMMARY</span>
          <h1>Review your print</h1>
          <p>Everything looks right? You can still edit any file before continuing.</p>
        </div>

        <div className="summary-list">
          {order.files.map((file) => (
            <div className="summary-card" key={file.id}>
              <div className={`summary-file-icon ${file.type === 'photo' ? 'photo' : ''}`}>
                {file.type === 'photo' ? <ImageIcon size={20} /> : <FileText size={20} />}
              </div>
              <div className="summary-file-content">
                <div className="summary-file-heading">
                  <strong>{file.name}</strong>
                  <button className="edit-button" onClick={() => navigate(`/configure/${file.id}`)}>
                    <Pencil size={14} /> Edit
                  </button>
                </div>
                <span>{file.type === 'photo' ? '1 image' : `${getSelectedPageCount(file)} of ${file.pages} pages selected`} · {formatOptions(file)}</span>
                <div className="summary-price">₹{getFilePrintCost(file, pricing)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="totals-card">
          <div><span>Total pages</span><strong>{totals.totalPages}</strong></div>
          <div><span>Total copies</span><strong>{totals.totalCopies}</strong></div>
          <div className="total-row"><span>Estimated total</span><strong>₹{totals.total}</strong></div>
        </div>

        <div className="page-actions">
          <Button className="bottom-cta" onClick={() => navigate('/payment')}>
            Continue to payment
          </Button>
          <button className="text-back" onClick={() => navigate('/files')}><ArrowLeft size={15} /> Back to files</button>
        </div>
      </PageShell>
    </>
  );
}

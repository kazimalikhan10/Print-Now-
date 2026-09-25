import { ArrowLeft, Check, FileText, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import { useOrder } from '../context/OrderContext';
import { getOrderTotals } from '../utils';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { order, submitJob } = useOrder();
  const totals = getOrderTotals(order.files);

  const handleSubmit = () => {
    const jobId = submitJob();
    navigate(`/tracking/${jobId}`);
  };

  return (
    <>
      <Header showBack onBack={() => navigate('/customer')} />
      <PageShell>
        <StepIndicator current={5} />
        <div className="page-intro compact">
          <span className="step-label">FINAL CHECK</span>
          <h1>Ready to print?</h1>
          <p>Please review the order once before sending it to the shop.</p>
        </div>

        <div className="confirmation-hero">
          <div className="confirm-icon"><Check size={25} /></div>
          <strong>{order.files.length} {order.files.length === 1 ? 'file' : 'files'}</strong>
          <span>{totals.totalPages} total pages · {totals.totalCopies} total copies</span>
        </div>

        <div className="confirmation-card">
          <div className="confirm-row"><span>Estimated amount</span><strong>₹{totals.total}</strong></div>
          <div className="confirm-row"><span>Customer</span><strong>{order.customer.name}</strong></div>
          <div className="confirm-row"><span>Mobile</span><strong>{order.customer.phone}</strong></div>
          <div className="confirm-row"><span>Payment</span><strong>{order.checkoutPayment?.method === 'shop' ? 'Pay at shop' : order.checkoutPayment?.status === 'mock-paid' ? 'Paid online · demo' : 'Payment pending'}</strong></div>
        </div>

        <div className="shop-mini-card">
          <Store size={20} />
          <div><strong>{order.shop.name}</strong><span>{order.shop.location}</span></div>
        </div>

        <div className="confirmation-file-list">
          {order.files.map((file) => (
            <div key={file.id}><FileText size={15} /><span>{file.name}</span></div>
          ))}
        </div>

        <div className="page-actions">
          <Button className="bottom-cta" onClick={handleSubmit}>Submit Print Job</Button>
          <button className="text-back" onClick={() => navigate('/summary')}><ArrowLeft size={15} /> Go back & edit</button>
        </div>
      </PageShell>
    </>
  );
}

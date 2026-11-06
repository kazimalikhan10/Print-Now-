import { AlertTriangle, ArrowLeft, Check, CircleDollarSign, Printer, Receipt, UserRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';
import { getLinePrice } from '../../utils/pricing';

const labels = { submitted: 'Submitted', processing: 'Processing', printing: 'Printing', ready: 'Ready for pickup', action_required: 'Action required', completed: 'Completed', cancelled: 'Cancelled' };
const next = { submitted: 'processing', processing: 'printing', printing: 'ready', ready: 'completed' };
export default function OwnerOrderDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { orders, updateOrderStatus, updatePaymentStatus, approveCashPayment, pricing, cancelOrder, setOrderActionRequired } = useOrder();
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const order = orders.find((item) => item.id === id);
  const handlePaymentAction = async () => {
    if (order.paymentStatus === 'paid') return;
    setPaymentError('');
    if (order.paymentId && order.paymentMethod === 'shop') {
      setPaymentBusy(true);
      try { await approveCashPayment(order.id); }
      catch (error) { setPaymentError(error?.message || 'Could not confirm the cash payment.'); }
      finally { setPaymentBusy(false); }
      return;
    }
    updatePaymentStatus(order.id, 'paid');
  };
  if (!order) return <OwnerShell title="Order not found"><div className="owner-empty"><strong>Order not found</strong><button className="owner-primary-button" onClick={() => navigate('/owner/orders')}>Back to orders</button></div></OwnerShell>;
  return <OwnerShell title={order.id}>
    <button className="owner-back-link" onClick={() => navigate('/owner/orders')}><ArrowLeft size={16}/> Back to orders</button>
    <div className="order-detail-grid">
      <section className="order-detail-card"><div className="detail-card-head"><div><span className="owner-eyebrow">PRINT JOB</span><h2>{order.id}</h2></div><span className={`status-chip status-${order.status}`}>{labels[order.status]}</span></div>
        <div className="job-timeline-mini">{['submitted','processing','printing','ready','completed'].map((status, i) => <div key={status} className={`job-dot ${['submitted','processing','printing','ready','completed'].indexOf(order.status) >= i ? 'done' : ''}`}><span>{i + 1}</span><small>{labels[status]}</small></div>)}</div>
        <div className="detail-actions"><button className="owner-primary-button" disabled={!next[order.status]} onClick={() => next[order.status] && updateOrderStatus(order.id, next[order.status])}>{next[order.status] === 'processing' ? 'Start processing' : next[order.status] === 'printing' ? 'Start printing' : next[order.status] === 'ready' ? 'Mark ready' : next[order.status] === 'completed' ? 'Mark completed' : 'Job complete'} <Printer size={16}/></button><button className="owner-secondary-button" onClick={() => setOrderActionRequired(order.id, 'Please review the files before printing.')}><AlertTriangle size={16}/> Action required</button><button className={`owner-secondary-button ${order.paymentStatus === 'paid' ? 'paid-button' : ''}`} disabled={paymentBusy || order.paymentStatus === 'paid'} onClick={handlePaymentAction}><CircleDollarSign size={16}/>{paymentBusy ? 'Confirming…' : order.paymentStatus === 'paid' ? 'Paid' : order.paymentMethod === 'shop' && order.paymentId ? 'Approve cash payment' : 'Mark paid'}</button><button className="owner-secondary-button" onClick={() => window.print()}><Printer size={16}/> Print job sheet</button></div>
      </section>
      {paymentError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{paymentError}</p>}
      <section className="order-detail-card"><div className="detail-card-head"><div><span className="owner-eyebrow">CUSTOMER</span><h2>{order.customer?.name || 'Guest customer'}</h2></div><UserRound size={22}/></div><div className="detail-contact"><span>{order.customer?.phone || 'No phone provided'}</span><span>{order.customer?.email || 'No email provided'}</span></div></section>
      <section className="order-detail-card order-files-detail"><div className="detail-card-head"><div><span className="owner-eyebrow">PRINT ITEMS</span><h2>{order.files.length} {order.files.length === 1 ? 'file' : 'files'}</h2></div><strong>₹{order.total}</strong></div>{order.files.map((file) => <div className="owner-file-detail" key={`${order.id}-${file.name}`}><div><strong>{file.name}</strong><span>{file.selectedPages || file.pages} selected of {file.pages} pages · {file.copies} copies</span></div><div><span>{file.paperSize} · {file.color === 'color' ? 'Colour' : 'B&W'} · {file.sides === 'double' ? 'Double-sided' : 'Single-sided'}</span><strong>₹{getLinePrice({ type: file.type, options: { paperSize: file.paperSize, color: file.color, sides: file.sides, copies: file.copies, pageSelection: file.pageSelection, pageRange: file.pageRange }, pages: file.pages }, pricing)}</strong></div></div>)}</section>
      <section className="order-detail-card"><div className="detail-card-head"><div><span className="owner-eyebrow">RECEIPT</span><h2>Payment</h2></div><Receipt size={22}/></div><div className="receipt-row"><span>Print total</span><strong>₹{order.total}</strong></div><div className="receipt-row"><span>Payment status</span><strong>{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</strong></div><button className="owner-secondary-button full" onClick={() => window.print()}>Print receipt</button>{!['completed','cancelled'].includes(order.status) && <button className="owner-danger-button full" onClick={() => cancelOrder(order.id)}>Cancel order</button>}</section>
    </div>
  </OwnerShell>;
}

import { ArrowRight, CheckCircle2, Clock3, IndianRupee, Printer, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';

const labels = { submitted: 'Submitted', processing: 'Processing', printing: 'Printing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };

export default function OwnerDashboardPage() {
  const { orders } = useOrder();
  const navigate = useNavigate();
  const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const today = orders.filter((o) => o.createdAt.includes('Today'));
  const revenue = today.reduce((sum, o) => sum + o.total, 0);
  const ready = orders.filter((o) => o.status === 'ready').length;
  const printing = orders.filter((o) => ['processing', 'printing'].includes(o.status)).length;
  const actionRequired = orders.filter((o) => o.status === 'action_required').length;

  return <OwnerShell title="Dashboard">
    <section className="owner-metrics">
      <div className="owner-metric"><ShoppingBag size={19}/><span>Today's orders</span><strong>{today.length}</strong></div>
      <div className="owner-metric"><IndianRupee size={19}/><span>Today's revenue</span><strong>₹{revenue}</strong></div>
      <div className="owner-metric"><Printer size={19}/><span>Printing now</span><strong>{printing}</strong></div>
      <div className="owner-metric"><CheckCircle2 size={19}/><span>Ready for pickup</span><strong>{ready}</strong></div>
      <div className="owner-metric owner-metric-alert"><Clock3 size={19}/><span>Needs attention</span><strong>{actionRequired}</strong></div>
    </section>

    <section className="owner-section-head"><div><span className="owner-eyebrow">LIVE QUEUE</span><h2>Active orders</h2></div><button onClick={() => navigate('/owner/orders')}>View all <ArrowRight size={16}/></button></section>
    <div className="owner-order-list">
      {active.slice(0, 5).map((item) => <article className="owner-order-card" key={item.id}>
        <div className="owner-order-main"><div className="owner-order-id">{item.id}</div><strong>{item.customer?.name || 'Guest customer'}</strong><span>{item.files?.map((f) => f.name).join(', ')}</span></div>
        <div className="owner-order-meta"><span className={`status-chip status-${item.status}`}>{labels[item.status] || item.status}</span><strong>₹{item.total}</strong><small>{item.createdAt}</small></div>
      </article>)}
      {!active.length && <div className="owner-empty"><Clock3 size={24}/><strong>No active orders</strong><span>New customer orders will appear here.</span></div>}
    </div>
  </OwnerShell>;
}

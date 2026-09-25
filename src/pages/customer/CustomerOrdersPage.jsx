import { Copy, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PageShell from '../../components/layout/PageShell';
import { useOrder } from '../../context/OrderContext';

const labels = { submitted: 'Submitted', processing: 'Processing', printing: 'Printing', ready: 'Ready', action_required: 'Action required', completed: 'Completed', cancelled: 'Cancelled' };
export default function CustomerOrdersPage() {
  const { orders, reorder, customer, auth } = useOrder();
  const navigate = useNavigate();
  if (!auth.signedIn || auth.role !== 'customer') { navigate('/login', { replace: true }); return null; }
  return <><Header showBack onBack={() => navigate('/')} /><PageShell><div className="page-intro compact"><span className="step-label">MY ORDERS</span><h1>Previous printouts</h1><p>View completed jobs and use a previous configuration as a starting point.</p></div><div className="customer-orders-head"><div><span className="step-label">CUSTOMER ACCOUNT</span><h2>{customer.name ? `Welcome, ${customer.name}` : 'Previous printouts'}</h2></div><button className="small-outline" onClick={()=>navigate('/profile')}>Profile</button></div><div className="customer-order-list">{orders.map((item) => <article className="customer-order-card" key={item.id}><div className="customer-order-top"><div><strong>{item.id}</strong><span>{item.createdAt}</span></div><span className={`status-chip status-${item.status}`}>{labels[item.status] || item.status}</span></div><div className="customer-order-files">{item.files?.map((file) => <div key={file.name}><strong>{file.name}</strong><span>{file.selectedPages || file.pages} pages · {file.paperSize} · {file.color === 'color' ? 'Colour' : 'B&W'}</span></div>)}</div><div className="customer-order-bottom"><strong>₹{item.total}</strong><div><button className="small-outline" onClick={()=>navigate(`/orders/${item.id}`)}><Copy size={14}/> Order details</button><button className="small-primary" onClick={()=>{ if(reorder(item.id)) navigate('/files'); }}><RotateCcw size={14}/> Reorder</button></div></div></article>)}</div></PageShell></>;
}

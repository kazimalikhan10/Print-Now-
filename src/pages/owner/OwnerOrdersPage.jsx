import { CircleDollarSign, Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';

const statuses = ['submitted', 'processing', 'printing', 'ready', 'action_required', 'completed', 'cancelled'];
const labels = { submitted: 'Submitted', processing: 'Processing', printing: 'Printing', ready: 'Ready', action_required: 'Action required', completed: 'Completed', cancelled: 'Cancelled' };

export default function OwnerOrdersPage() {
  const { orders, updateOrderStatus, updatePaymentStatus } = useOrder();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const visible = filtered.filter((o) => `${o.id} ${o.customer?.name || ''} ${o.customer?.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <OwnerShell title="Orders">
    <div className="owner-toolbar"><div className="owner-filter-tabs">{['all', 'submitted', 'processing', 'printing', 'ready', 'action_required', 'completed'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'all' ? 'All' : labels[value]}</button>)}</div><div className="owner-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search orders" /></div><span>{visible.length} orders</span></div>
    <div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Order</th><th>Customer</th><th>Print job</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.id}>
      <td><strong>{item.id}</strong><small>{item.createdAt}</small></td>
      <td><strong>{item.customer?.name || 'Guest'}</strong><small>{item.customer?.phone || 'No phone'}</small></td>
      <td><strong>{item.pages} pages</strong><small>{item.files?.[0]?.paperSize || '—'} · {item.files?.[0]?.color === 'color' ? 'Colour' : 'B&W'}</small></td>
      <td><strong>₹{item.total}</strong></td>
      <td><button className={`payment-chip ${item.paymentStatus}`} onClick={() => updatePaymentStatus(item.id, item.paymentStatus === 'paid' ? 'pending' : 'paid')}><CircleDollarSign size={14}/>{item.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</button></td>
      <td><select className={`status-select status-${item.status}`} value={item.status} onChange={(e) => updateOrderStatus(item.id, e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></td>
      <td><button className="table-icon-button" title="Open order" onClick={()=>navigate(`/owner/orders/${item.id}`)}><Eye size={17}/></button></td>
    </tr>)}</tbody></table></div>
  </OwnerShell>;
}

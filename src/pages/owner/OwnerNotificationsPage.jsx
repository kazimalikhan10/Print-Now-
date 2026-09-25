import { Bell, CheckCheck, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';

export default function OwnerNotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markNotificationsRead } = useOrder();
  return <OwnerShell title="Notifications">
    <div className="owner-section-head"><div><span className="owner-eyebrow">ACTIVITY</span><h2>Shop updates</h2></div><button className="owner-secondary-button" onClick={markNotificationsRead}><CheckCheck size={15}/> Mark all read</button></div>
    <div className="owner-notification-list">
      {notifications.length ? notifications.map((item) => <article className={`owner-notification-card ${item.read ? '' : 'unread'}`} key={item.id}><div className="owner-notification-icon"><Bell size={17}/></div><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.createdAt}</small></div>{item.orderId && <button className="table-icon-button" onClick={() => navigate(`/owner/orders/${item.orderId}`)} title="Open order"><Eye size={16}/></button>}</article>) : <div className="owner-empty"><Bell size={24}/><strong>No notifications yet</strong><span>Order and shop events will appear here.</span></div>}
    </div>
  </OwnerShell>;
}

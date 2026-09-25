import { BarChart3, Bell, ClipboardList, LogOut, Package, Settings, Store, Tags, Users, BarChart2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';

const links = [
  { to: '/owner', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/owner/orders', label: 'Orders', icon: ClipboardList },
  { to: '/owner/pricing', label: 'Pricing', icon: Tags },
  { to: '/owner/shop', label: 'Shop Settings', icon: Store },
  { to: '/owner/reports', label: 'Reports', icon: BarChart2 },
  { to: '/owner/inventory', label: 'Inventory', icon: Package },
  { to: '/owner/staff', label: 'Staff', icon: Users },
];

export default function OwnerShell({ children, title }) {
  const navigate = useNavigate();
  const { signOut, notifications, markNotificationsRead } = useOrder();
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="owner-app">
      <aside className="owner-sidebar">
        <div className="owner-brand"><span>PN</span><div><strong>Print Now</strong><small>Owner Portal</small></div></div>
        <div className="owner-shop-mini"><div className="owner-logo">ABC</div><div><strong>ABC Digital Prints</strong><small>Park Street, Kolkata</small></div></div>
        <nav className="owner-nav" aria-label="Owner navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <button className="owner-logout" onClick={()=>{signOut();navigate('/owner/login')}}><LogOut size={17} /> Sign out</button>
      </aside>
      <main className="owner-main">
        <header className="owner-topbar"><div><span className="owner-eyebrow">SHOP ADMIN</span><h1>{title}</h1></div><div className="owner-top-actions"><button className="owner-notification-button" onClick={() => { markNotificationsRead(); navigate('/owner/notifications'); }} title="Notifications">{unread ? <span>{unread}</span> : null}<Bell size={18}/></button><NavLink className="owner-settings-icon" to="/owner/shop" aria-label="Settings"><Settings size={19} /></NavLink><button className="owner-mobile-signout" onClick={() => { signOut(); navigate('/owner/login'); }} aria-label="Sign out" title="Sign out"><LogOut size={18}/></button></div></header>
        {children}
      </main>
    </div>
  );
}

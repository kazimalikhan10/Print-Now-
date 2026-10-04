import { ArrowRight, Store, UserCircle } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PageShell from '../../components/layout/PageShell';
import { useOrder } from '../../context/OrderContext';

export default function AccountEntryPage() {
  const navigate = useNavigate();
  const { auth } = useOrder();

  if (auth.signedIn && auth.role === 'customer') {
    return <Navigate to="/profile" replace />;
  }

  if (auth.signedIn && auth.role === 'owner') {
    return <Navigate to="/owner" replace />;
  }

  return <><Header showBack onBack={() => navigate('/')} /><PageShell>
    <div className="page-intro compact"><span className="step-label">ACCOUNT</span><h1>Sign in to Print Now</h1><p>Choose whether you're returning as a customer or accessing your shop portal.</p></div>
    <div className="account-choice-grid">
      <button className="account-choice-card" onClick={() => navigate('/login')}><span><UserCircle size={22}/></span><strong>Customer sign in</strong><small>View previous printouts and reorder quickly.</small><ArrowRight size={17}/></button>
      <button className="account-choice-card" onClick={() => navigate('/owner/login')}><span><Store size={22}/></span><strong>Owner / shop sign in</strong><small>Manage orders, pricing and shop settings.</small><ArrowRight size={17}/></button>
    </div>
  </PageShell></>;
}

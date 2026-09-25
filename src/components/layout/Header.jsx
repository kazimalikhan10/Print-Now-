import { LogOut, MessageCircle, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';

export default function Header({ showBack = false, onBack }) {
  const navigate = useNavigate();
  const { order, auth, signOut } = useOrder();
  const phone = order.shop?.phone;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-side header-side-left">
          {showBack ? (
            <button className="icon-button" onClick={onBack} aria-label="Go back">←</button>
          ) : (
            <div className="brand-mark">PN</div>
          )}
        </div>

        <button className="brand-center" type="button" onClick={() => navigate('/')} aria-label="Print Now home">
          <span className="brand-name">Print Now</span>
        </button>

        <div className="header-actions">
          <a
            className="contact-header-button"
            href={phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined}
            aria-label={phone ? `Contact ${order.shop?.name || 'shop'}` : 'Shop contact unavailable'}
            title={phone ? `Contact ${order.shop?.name || 'shop'}` : 'Shop contact unavailable'}
            onClick={(event) => { if (!phone) event.preventDefault(); }}
          >
            <MessageCircle size={17} />
            <span>Contact</span>
          </a>
          <button
            className="icon-button account-header-button"
            onClick={() => navigate('/account')}
            aria-label={auth.signedIn ? 'Account' : 'Sign in'}
          >
            <UserCircle size={19} />
          </button>
          {auth.signedIn && (
            <button className="icon-button header-signout-button" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

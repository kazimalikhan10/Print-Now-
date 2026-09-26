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

  const iconButton = 'grid h-[38px] w-[38px] place-items-center rounded-[10px] border-0 bg-transparent text-[#111827] transition hover:bg-[#f3f4f8]';

  return (
    <header className="sticky top-0 z-20 border-b border-[#edf0f6] bg-white/[.96] backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] max-w-[760px] items-center gap-[9px] px-[18px]">
        <div className="flex items-center">
          {showBack ? (
            <button className={iconButton} onClick={onBack} aria-label="Go back">←</button>
          ) : (
            <div className="grid h-[22px] w-[22px] place-items-center rounded-[7px] border-2 border-[#4338f2] text-[.58rem] font-bold text-[#4338f2]">PN</div>
          )}
        </div>

        <button className="mx-auto border-0 bg-transparent p-0" type="button" onClick={() => navigate('/')} aria-label="Print Now home">
          <span className="font-bold tracking-[-.02em] text-[#2932c9]">Print Now</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <a
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[10px] px-2.5 text-[.72rem] font-semibold text-[#3730c9] transition hover:bg-[#f3f4f8]"
            href={phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined}
            aria-label={phone ? `Contact ${order.shop?.name || 'shop'}` : 'Shop contact unavailable'}
            title={phone ? `Contact ${order.shop?.name || 'shop'}` : 'Shop contact unavailable'}
            onClick={(event) => { if (!phone) event.preventDefault(); }}
          >
            <MessageCircle size={17} />
            <span>Contact</span>
          </a>
          <button
            className={iconButton}
            onClick={() => navigate('/account')}
            aria-label={auth.signedIn ? 'Account' : 'Sign in'}
          >
            <UserCircle size={19} />
          </button>
          {auth.signedIn && (
            <button className={iconButton} onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

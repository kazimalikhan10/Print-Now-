import { ArrowRight, LockKeyhole, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useOrder } from '../../context/OrderContext';
import Header from '../../components/layout/Header';
import PageShell from '../../components/layout/PageShell';
import Button from '../../components/ui/Button';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useOrder();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('Customer');
  return <><Header showBack onBack={() => navigate('/')} /><PageShell><div className="account-card"><div className="account-icon"><LockKeyhole size={22}/></div><span className="step-label">CUSTOMER ACCOUNT</span><h1>See your previous printouts</h1><p>Sign in with your mobile number to view orders and quickly reorder previous jobs.</p><label className="account-field"><span>Your name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" /></label><label className="account-field"><span>Mobile number</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g, "").slice(0,10))} placeholder="10-digit mobile number" maxLength="10" /></label><Button className="wide-button" disabled={phone.length !== 10} onClick={() => { signIn('customer',{name,phone}); navigate('/orders'); }}><ArrowRight size={18}/> Continue with OTP</Button><button className="guest-link" onClick={() => navigate('/status')}>Continue without an account</button></div></PageShell></>;
}

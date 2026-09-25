import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import { useOrder } from '../context/OrderContext';

export default function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { order, updateCustomer } = useOrder();
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured);
  const [error, setError] = useState('');

  if (!order.files.length || !allConfigured) {
    navigate('/files');
    return null;
  }

  const handleContinue = (event) => {
    event.preventDefault();
    if (!order.customer.name.trim() || !order.customer.phone.trim()) {
      setError('Please enter your name and mobile number.');
      return;
    }
    setError('');
    navigate('/confirmation');
  };

  return (
    <>
      <Header showBack onBack={() => navigate('/summary')} />
      <PageShell>
        <StepIndicator current={5} />
        <div className="page-intro compact">
          <span className="step-label">YOUR DETAILS</span>
          <h1>Almost there</h1>
          <p>We only need a couple of details so the shop can identify your order.</p>
        </div>

        <form className="details-form" onSubmit={handleContinue}>
          <label>
            <span>Name *</span>
            <input
              value={order.customer.name}
              onChange={(e) => updateCustomer({ name: e.target.value })}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label>
            <span>Mobile Number *</span>
            <input
              value={order.customer.phone}
              onChange={(e) => updateCustomer({ phone: e.target.value })}
              placeholder="98765 43210"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label>
            <span>Email <em>optional</em></span>
            <input
              value={order.customer.email}
              onChange={(e) => updateCustomer({ email: e.target.value })}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <div className="guest-note">
            <span className="guest-check">✓</span>
            <div><strong>No account required</strong><p>You can print as a guest. Your details are only used for this order.</p></div>
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="page-actions">
            <Button type="submit" className="bottom-cta">Continue</Button>
          </div>
        </form>
      </PageShell>
    </>
  );
}

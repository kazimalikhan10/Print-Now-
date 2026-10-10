import { Banknote, Check, ChevronRight, CreditCard, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';
import { getOrderTotals } from '../utils';

const methods = [
  { id: 'upi', label: 'UPI', hint: 'Pay using a UPI app or UPI ID', icon: Smartphone },
  { id: 'card', label: 'Card', hint: 'Credit or debit card', icon: CreditCard },
  { id: 'shop', label: 'Pay at shop', hint: 'Pay when you collect your prints', icon: Banknote },
];

const upiApps = [
  { id: 'gpay', label: 'Google Pay', short: 'G', package: 'com.google.android.apps.nbu.paisa.user' },
  { id: 'phonepe', label: 'PhonePe', short: 'P', package: 'com.phonepe.app' },
  { id: 'paytm', label: 'Paytm', short: 'P', package: 'net.one97.paytm' },
  { id: 'bhim', label: 'BHIM', short: 'B', package: 'in.org.npci.upiapp' },
];

function buildUpiIntent({ app, upiId, name, amount }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name || 'Print Now Shop',
    am: String(amount),
    cu: 'INR',
  });
  const query = params.toString();
  if (!app) return `upi://pay?${query}`;
  return `intent://pay?${query}#Intent;scheme=upi;package=${app.package};end`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { order, pricing, setCheckoutPayment } = useOrder();
  const [method, setMethod] = useState(order.checkoutPayment?.method || 'shop');
  const [upiMode, setUpiMode] = useState(order.checkoutPayment?.upiMode || 'app');
  const [upiId, setUpiId] = useState(order.checkoutPayment?.upiId || '');
  const [selectedApp, setSelectedApp] = useState(order.checkoutPayment?.upiApp || '');
  const [cardOpen, setCardOpen] = useState(false);
  const [paymentState, setPaymentState] = useState(order.checkoutPayment?.status === 'mock-paid' ? 'success' : 'pending');
  const totals = getOrderTotals(order.files, pricing);
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured);
  const shopUpiId = order.shop?.upiId || 'shop@upi';

  const selectedMethod = useMemo(() => methods.find((item) => item.id === method), [method]);

  useEffect(() => {
    if (!order.files.length || !allConfigured) navigate('/files', { replace: true });
  }, [allConfigured, navigate, order.files.length]);

  if (!order.files.length || !allConfigured) return null;

  const selectMethod = (next) => {
    setMethod(next);
    setCardOpen(false);
    if (next !== 'upi') setSelectedApp('');
  };

  const openUpiApp = (app) => {
    setSelectedApp(app.id);
    setPaymentState('processing');
    setCheckoutPayment({ method: 'upi', status: 'processing', upiMode: 'app', upiApp: app.id });
    window.location.href = buildUpiIntent({ app, upiId: shopUpiId, name: order.shop?.name, amount: totals.total });
  };

  const simulatePayment = (result) => {
    setPaymentState(result);
    const status = result === 'success' ? 'mock-paid' : result;
    setCheckoutPayment({ method, status, upiMode: method === 'upi' ? upiMode : null, upiId: method === 'upi' && upiMode === 'id' ? upiId.trim() : null, upiApp: method === 'upi' && upiMode === 'app' ? selectedApp : null });
  };

  const retryPayment = () => {
    setPaymentState('pending');
    setCheckoutPayment({ method, status: 'pending' });
  };


  const continueToDetails = () => {
    if (method === 'upi' && upiMode === 'id' && !/^\S+@\S+$/.test(upiId.trim())) return;
    if (method === 'card' && !cardOpen) { setCardOpen(true); return; }
    if (method !== 'shop' && paymentState !== 'success') return;
    const status = method === 'shop' ? 'pending' : 'mock-paid';
    setCheckoutPayment({
      method,
      status,
      upiMode: method === 'upi' ? upiMode : null,
      upiId: method === 'upi' && upiMode === 'id' ? upiId.trim() : null,
      upiApp: method === 'upi' && upiMode === 'app' ? selectedApp : null,
    });
    if (method !== 'card' || cardOpen) navigate('/customer');
  };

  return (
    <>
      <Header showBack onBack={() => navigate('/summary')} />
      <PageShell className="payment-page">
<div className="payment-heading">
          <div>
            <span className="step-label">PAYMENT</span>
            <h1>Choose a payment method</h1>
            <p>Securely choose how you want to pay for this print order.</p>
          </div>
        </div>

        <div className="payment-checkout-layout">
          <section className="payment-main-card">
            <div className="payment-amount-row">
              <div><span>Amount to pay</span><strong>₹{totals.total}</strong></div>
              <span className="payment-secure-badge">Secure checkout</span>
            </div>

            <div className="payment-method-list" aria-label="Payment methods">
              {methods.map(({ id, label, hint, icon: Icon }) => (
                <button key={id} type="button" className={`payment-method payment-method-market ${method === id ? 'selected' : ''}`} onClick={() => selectMethod(id)}>
                  <span className="payment-method-icon"><Icon size={19} /></span>
                  <span><strong>{label}</strong><small>{hint}</small></span>
                  <span className="payment-radio">{method === id && <Check size={13} />}</span>
                </button>
              ))}
            </div>

            {method === 'upi' && (
              <div className="payment-subsection">
                <div className="payment-subsection-tabs">
                  <button type="button" className={upiMode === 'app' ? 'active' : ''} onClick={() => setUpiMode('app')}>UPI apps</button>
                  <button type="button" className={upiMode === 'id' ? 'active' : ''} onClick={() => setUpiMode('id')}>Enter UPI ID</button>
                </div>

                {upiMode === 'app' ? (
                  <>
                    <div className="upi-app-grid">
                      {upiApps.map((app) => (
                        <button key={app.id} type="button" className={`upi-app-card ${selectedApp === app.id ? 'selected' : ''}`} onClick={() => openUpiApp(app)}>
                          <span className="upi-app-logo">{app.short}</span>
                          <strong>{app.label}</strong>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </div>
                    <p className="payment-help-text">Your browser cannot read a list of installed apps directly. On a compatible phone, choosing an app uses the phone's UPI intent/app chooser.</p>
                  </>
                ) : (
                  <div className="upi-id-form">
                    <label htmlFor="upi-id">UPI ID</label>
                    <input id="upi-id" value={upiId} onChange={(event) => setUpiId(event.target.value.trim())} placeholder="yourname@upi" autoComplete="off" inputMode="email" />
                    <small>Example: name@oksbi, name@ybl, name@paytm</small>
                  </div>
                )}
              </div>
            )}

            {method === 'card' && (
              <div className="payment-subsection card-payment-panel">
                <div className="card-visual"><span>PRINT NOW</span><strong>••••  ••••  ••••  1234</strong><small>Secure card payment</small></div>
                <button type="button" className="payment-secondary-action" onClick={() => setCardOpen(true)}>{cardOpen ? 'Card details ready' : 'Enter card details'} <ChevronRight size={15} /></button>
                <p className="payment-help-text">This is a frontend-only payment simulation. No real card information is collected.</p>
              </div>
            )}

            {method === 'shop' && (
              <div className="payment-subsection pay-at-shop-panel">
                <div className="pay-at-shop-icon"><Banknote size={21} /></div>
                <div><strong>Pay when you collect</strong><p>Bring your order ID to the shop. The final amount is shown before printing.</p></div>
              </div>
            )}

            {method !== 'shop' && (
              <div className={`payment-state-panel payment-state-${paymentState}`}>
                <div><strong>{paymentState === 'success' ? 'Payment successful' : paymentState === 'failed' ? 'Payment failed' : paymentState === 'cancelled' ? 'Payment cancelled' : paymentState === 'processing' ? 'Payment processing' : 'Ready to pay'}</strong><span>{paymentState === 'success' ? 'The payment is recorded in this frontend demo.' : paymentState === 'failed' ? 'No money was charged. You can retry the payment.' : paymentState === 'cancelled' ? 'The payment was cancelled. You can choose another method or retry.' : paymentState === 'processing' ? 'Waiting for the simulated payment result.' : 'Use the controls below to simulate the checkout result.'}</span></div>
                <div className="payment-state-actions">
                  {paymentState === 'processing' && <><button type="button" onClick={() => simulatePayment('success')}>Simulate success</button><button type="button" onClick={() => simulatePayment('failed')}>Simulate failure</button></>}
                  {paymentState === 'failed' && <button type="button" onClick={retryPayment}>Retry payment</button>}
                  {paymentState === 'cancelled' && <button type="button" onClick={retryPayment}>Retry payment</button>}
                  {paymentState === 'pending' && <button type="button" onClick={() => simulatePayment('processing')}>Start demo payment</button>}
                  {paymentState === 'processing' && <button type="button" onClick={() => simulatePayment('cancelled')}>Cancel</button>}
                </div>
              </div>
            )}
          </section>

          <aside className="payment-order-card">
            <span className="eyebrow">ORDER SUMMARY</span>
            <div className="payment-order-total"><span>Total</span><strong>₹{totals.total}</strong></div>
            <div className="payment-order-line"><span>Selected pages</span><strong>{totals.totalPages}</strong></div>
            <div className="payment-order-line"><span>Copies</span><strong>{totals.totalCopies}</strong></div>
            <div className="payment-order-line"><span>Payment</span><strong>{selectedMethod?.label}</strong></div>
            <div className="payment-shop-note">{order.shop?.name} · {order.shop?.location}</div>
          </aside>
        </div>

        <div className="page-actions payment-actions">
          <Button className="bottom-cta" onClick={continueToDetails} disabled={(method === 'upi' && upiMode === 'id' && !/^\S+@\S+$/.test(upiId.trim())) || (method !== 'shop' && paymentState !== 'success')}>
            {method === 'shop' ? 'Continue to order details' : method === 'card' && !cardOpen ? 'Enter card details' : 'Continue'}
          </Button>
        </div>
      </PageShell>
    </>
  );
}

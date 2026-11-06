import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText, Image as ImageIcon, Plus, Trash2, Smartphone, Store, ShieldCheck, LoaderCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';
import { prepareSelectedFiles } from '../utils/prepareSelectedFiles';
import { getFilePrintCost, getOrderTotals, getSelectedPageCount } from '../utils';
import { api, isApiConfigured, uploadFileToBackend } from '../services/apiService';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      if (window.Razorpay) resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(checkout, customer, shopName, jobId) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const instance = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency || 'INR',
      name: shopName || 'PrintNow',
      description: `Print order ${jobId}`,
      order_id: checkout.orderId,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      notes: { printJobId: jobId },
      theme: { color: '#4b43e8' },
      config: {
        display: {
          blocks: {
            upi_first: { name: 'Pay using UPI', instruments: [{ method: 'upi' }] },
          },
          sequence: ['block.upi_first'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: (response) => finish({ type: 'success', response }),
      modal: { ondismiss: () => finish({ type: 'dismissed' }) },
    });
    instance.on('payment.failed', (response) => finish({
      type: 'failed',
      message: response?.error?.description || response?.error?.reason || 'The payment could not be completed. You can try again.',
    }));
    instance.open();
  });
}

function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { order, pricing, removeFile, updateCustomer, createPrintJob, finalizeCheckout, addFiles } = useOrder();
  const addFilesInputRef = useRef(null);
  const [addingFiles, setAddingFiles] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ price: true, details: true });
  const [error, setError] = useState(() => location.state?.uploadErrors?.join(' ') || '');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [pendingOnlinePayment, setPendingOnlinePayment] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [serverAmount, setServerAmount] = useState(null);
  const totals = getOrderTotals(order.files, pricing);
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured && !(file.type !== 'photo' && file.options?.pageSelection === 'custom' && getSelectedPageCount(file) < 1));
  const filesLocked = Boolean(pendingOnlinePayment);

  const handleAddFiles = async (event) => {
    const selected = Array.from(event.target.files || []); event.target.value = '';
    if (!selected.length) return;
    setAddingFiles(true); setError('');
    try {
      if (!isApiConfigured()) throw new Error('Backend URL is not configured. Add VITE_API_BASE_URL to .env and restart the frontend.');
      const result = await prepareSelectedFiles(selected);
      const uploadErrors = [...result.errors];
      const uploadedFiles = [];
      for (const file of result.files) {
        try {
          if (file.type === 'photo') {
            uploadedFiles.push({ ...file, backendFileId: null, backendFileStatus: null, backendValidation: null, backendAnalysis: null, configured: false });
            continue;
          }
          const backendFile = await uploadFileToBackend(file.sourceFile);
          uploadedFiles.push({ ...file, backendFileId: backendFile.id, backendFileStatus: backendFile.status, backendValidation: backendFile.validation, backendAnalysis: backendFile.analysis, pages: Number(backendFile.analysis?.pageCount) || file.pages, configured: true });
        } catch (uploadError) { uploadErrors.push(uploadError?.message || `Could not upload ${file.name}.`); }
      }
      if (uploadedFiles.length) addFiles(uploadedFiles);
      if (uploadErrors.length) setError(uploadErrors.join(' '));
    }
    catch (uploadError) { console.error(uploadError); setError(uploadError?.message || 'Could not prepare the selected files. Please try again.'); }
    finally { setAddingFiles(false); }
  };

  const toggleSection = (id) => setSectionsOpen((current) => ({ ...current, [id]: !current[id] }));

  const confirmPaymentWithBackend = async (paymentId, attempts = 18) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const payment = await api.payments.get(paymentId);
      const status = String(payment?.status || '').toUpperCase();
      if (status === 'SUCCESSFUL') return payment;
      if (['REJECTED', 'CANCELLED'].includes(status)) {
        throw new Error(`The payment is ${status.toLowerCase()}. Please contact the shop if money was deducted.`);
      }
      if (attempt < attempts - 1) await wait(1800);
    }
    return null;
  };

  const finishPaidOrder = (payment, jobId, paymentId) => {
    const amount = Number(payment?.amount);
    finalizeCheckout({
      jobId,
      paymentId,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      totalOverride: Number.isFinite(amount) ? amount : serverAmount,
    });
    setPendingOnlinePayment(null);
    navigate(`/tracking/${jobId}`);
  };

  const checkPendingPayment = async () => {
    if (!pendingOnlinePayment?.paymentId) return;
    setSubmitting(true);
    setError('');
    setPaymentMessage('Checking the verified payment status…');
    try {
      const payment = await confirmPaymentWithBackend(pendingOnlinePayment.paymentId, 18);
      if (payment?.status === 'SUCCESSFUL') {
        finishPaidOrder(payment, pendingOnlinePayment.jobId, pendingOnlinePayment.paymentId);
        return;
      }
      setPaymentMessage('Payment confirmation is still pending. Do not pay again if money has already been deducted. You can check again shortly.');
    } catch (statusError) {
      setError(statusError?.message || 'Could not check payment status. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!order.files.length) { setError('Add at least one file to continue.'); return; }
    if (!allConfigured) { const nextFile = order.files.find((file) => !file.configured); if (nextFile) navigate(`/configure/${nextFile.id}`, { state: { returnTo: '/checkout' } }); setError('Please complete the settings for each file and check any custom page ranges.'); return; }
    if (!order.customer.name.trim() || !order.customer.phone.trim()) { setSectionsOpen((current) => ({ ...current, details: true })); setError('Enter your name and mobile number to identify the order.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(order.customer.email || '')) { setSectionsOpen((current) => ({ ...current, details: true })); setError('Enter a valid email address. The payment backend requires it for the order receipt.'); return; }
    if (!isApiConfigured()) { setError('Backend URL is not configured. Add VITE_API_BASE_URL to .env and restart the frontend.'); return; }
    if (order.files.some((file) => !file.backendFileId)) { setError('One or more files are not uploaded to the backend. Remove them and upload them again.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const { jobId } = await createPrintJob();
      const customer = { name: order.customer.name.trim(), phone: order.customer.phone.trim(), email: order.customer.email.trim() };

      if (paymentMethod === 'shop') {
        const result = await api.payments.create({ printJobId: jobId, method: 'CASH', customer });
        const payment = result.payment;
        finalizeCheckout({ jobId, paymentId: payment._id, paymentMethod: 'shop', paymentStatus: 'pending', totalOverride: Number(payment.amount) });
        navigate(`/tracking/${jobId}`);
        return;
      }

      let pending = pendingOnlinePayment;
      if (!pending || pending.jobId !== jobId) {
        const result = await api.payments.create({ printJobId: jobId, method: 'ONLINE', customer });
        const payment = result.payment;
        if (!result.checkout?.keyId || !result.checkout?.orderId || !payment?._id) {
          throw new Error('The backend did not return the Razorpay Checkout details.');
        }
        pending = { jobId, paymentId: payment._id, checkout: result.checkout };
        setPendingOnlinePayment(pending);
        setServerAmount(Number(payment.amount));
      }

      setPaymentMessage('Opening secure Razorpay Checkout…');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Could not load Razorpay Checkout. Check your internet connection and try again.');
      const checkoutResult = await openRazorpayCheckout(pending.checkout, customer, order.shop?.name, jobId);

      if (checkoutResult.type === 'dismissed') {
        setPaymentMessage('Checkout was closed. If you completed payment in your UPI app, check its status before trying again.');
        return;
      }
      if (checkoutResult.type === 'failed') {
        setError(checkoutResult.message);
        setPaymentMessage('You can retry using the same payment order.');
        return;
      }

      setPaymentMessage('Payment response received. Verifying it securely with the backend…');
      const payment = await confirmPaymentWithBackend(pending.paymentId, 18);
      if (payment?.status === 'SUCCESSFUL') {
        finishPaidOrder(payment, jobId, pending.paymentId);
      } else {
        setPaymentMessage('Razorpay returned a response, but the backend has not confirmed the payment yet. Please check the status before retrying.');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Could not continue with checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order.files.length) {
    return <><Header showBack onBack={() => navigate('/')} /><PageShell><div className="rounded-2xl border border-[#e7e8ef] bg-white p-6 text-center"><h1 className="text-lg font-bold">Your checkout is empty</h1><p className="mt-2 text-sm text-[#70778a]">Select files or take a picture to start a print order.</p><Button className="mt-4 w-full" onClick={() => navigate('/upload')}>Add files</Button></div></PageShell></>;
  }

  return (
    <>
      <Header showBack onBack={() => navigate('/')} />
      <PageShell className="pb-28">
        <input ref={addFilesInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleAddFiles} aria-label="Add more files" />
        <div className="mb-5 mt-2">
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">PRINT & CHECKOUT</span>
          <h1 className="my-1 text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-tight tracking-[-.045em] text-[#171a24]">Review your print</h1>
          <p className="text-sm leading-relaxed text-[#70778a]">Review your files, confirm your details and choose how you want to pay.</p>
        </div>

        <section className="mb-4 rounded-2xl border border-[#e7e8ef] bg-white p-3.5 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold">Your files <span className="text-sm font-medium text-[#7d879e]">({order.files.length})</span></h2><p className="mt-0.5 text-xs text-[#7d879e]">Open each file to edit its print settings.</p></div><button type="button" onClick={() => addFilesInputRef.current?.click()} disabled={addingFiles || submitting || filesLocked} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#dcd9ff] bg-[#f7f6ff] px-3 py-2 text-xs font-bold text-[#4b3ff5]"><Plus size={15}/> {addingFiles ? 'Adding…' : 'Add more'}</button></div>
          <div className="flex flex-col gap-2">
            {order.files.map((file) => {
              const isPhoto = file.type === 'photo';
              const selectedPages = isPhoto ? 1 : getSelectedPageCount(file);
              return (
                <article key={file.id} className="overflow-hidden rounded-xl border border-[#e9eaf1] bg-white">
                  <div className="flex items-center gap-3 p-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isPhoto ? 'bg-[#fff0f5] text-[#e83e75]' : 'bg-[#eef0ff] text-[#4b43e8]'}`}>{isPhoto ? <ImageIcon size={19}/> : <FileText size={19}/>}</div>
                    <div className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm">{file.name}</strong><span className="mt-1 block text-[.68rem] text-[#7d879e]">{isPhoto ? `${file.options.photoQuantity || 6} photos · ${file.options.imageWidthMm || 35} × ${file.options.imageHeightMm || 45} mm · A4 PDF` : `${selectedPages}/${file.pages} pages · ${file.options.paperSize} · ${file.options.copies} copies`}</span></div>
                    <strong className="shrink-0 text-sm">₹{getFilePrintCost(file, pricing)}</strong>
                    <button type="button" disabled={submitting || filesLocked} onClick={() => navigate(`/configure/${file.id}`, { state: { returnTo: '/checkout' } })} className="shrink-0 rounded-lg bg-[#f4f3ff] px-3 py-2 text-xs font-bold text-[#4b43e8]">{isPhoto && !file.backendFileId ? 'Crop photo' : 'Edit'}</button>
                    <button type="button" disabled={submitting || filesLocked} onClick={() => removeFile(file.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#9a5260] hover:bg-[#fff1f2] disabled:opacity-40" aria-label={`Remove ${file.name}`}><Trash2 size={16}/></button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <button type="button" onClick={() => toggleSection('price')} className="flex w-full items-center justify-between text-left font-bold"><span>Price summary</span>{sectionsOpen.price ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
          {sectionsOpen.price && <div className="mt-2">
            <div className="flex justify-between py-1.5 text-sm text-[#72798a]"><span>Total pages</span><strong className="text-[#171b25]">{totals.totalPages}</strong></div>
            <div className="flex justify-between py-1.5 text-sm text-[#72798a]"><span>Total copies</span><strong className="text-[#171b25]">{totals.totalCopies}</strong></div>
            {totals.totalPhotoSheets > 0 && <div className="flex justify-between py-1.5 text-sm text-[#72798a]"><span>Photo sheets</span><strong className="text-[#171b25]">{totals.totalPhotoSheets}</strong></div>}
            <div className="mt-2 flex justify-between border-t border-[#edf0f4] pt-3"><span className="font-semibold">{serverAmount != null ? 'Backend total' : 'Estimated total'}</span><strong className="text-xl">₹{serverAmount != null ? serverAmount : totals.total}</strong></div>
            <p className="mt-2 text-xs text-[#7d879e]">{serverAmount != null ? 'The amount returned by the backend is used for payment.' : 'Final amount is calculated by the backend before payment.'}</p>
          </div>}
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
            <button type="button" onClick={() => toggleSection('details')} className="flex w-full items-center justify-between text-left font-bold"><span>Your details</span>{sectionsOpen.details ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
            {sectionsOpen.details && <><p className="mt-1 text-xs text-[#7d879e]">Your email is required by the payment service for the order receipt.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold">Name *<input required className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.name || ''} onChange={(e) => updateCustomer({name:e.target.value})} placeholder="Your name" autoComplete="name" disabled={filesLocked}/></label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold">Mobile number *<input required minLength={10} className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.phone || ''} onChange={(e) => updateCustomer({phone:e.target.value})} placeholder="98765 43210" inputMode="tel" autoComplete="tel" disabled={filesLocked}/></label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-2">Email *<input required type="email" className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.email || ''} onChange={(e) => updateCustomer({email:e.target.value})} placeholder="you@example.com" autoComplete="email" disabled={filesLocked}/></label>
            </div></>}
          </section>

          <section className="rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
            <div className="flex items-center justify-between gap-3"><h2 className="font-bold">Payment method</h2><span className="rounded-full bg-[#eef8f1] px-2.5 py-1 text-[.65rem] font-semibold text-[#19834b]">Secure checkout</span></div>
            <div className="mt-3 grid gap-2">
              <button type="button" disabled={filesLocked || submitting} onClick={() => setPaymentMethod('online')} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${paymentMethod === 'online' ? 'border-[#7771ee] bg-[#f7f6ff]' : 'border-[#e4e7ef] bg-white'}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eeedff] text-[#4b43e8]"><Smartphone size={20}/></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">Pay Online</strong><span className="mt-0.5 block text-xs text-[#7d879e]">UPI apps, cards and other Razorpay options</span></span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${paymentMethod === 'online' ? 'border-[#4b43e8]' : 'border-[#c8cbd5]'}`}>{paymentMethod === 'online' && <span className="h-2.5 w-2.5 rounded-full bg-[#4b43e8]"/>}</span>
              </button>
              <button type="button" disabled={filesLocked || submitting} onClick={() => setPaymentMethod('shop')} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${paymentMethod === 'shop' ? 'border-[#7771ee] bg-[#f7f6ff]' : 'border-[#e4e7ef] bg-white'}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff4e8] text-[#a45b12]"><Store size={20}/></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">Pay at Shop</strong><span className="mt-0.5 block text-xs text-[#7d879e]">Pay in cash when you visit the shop</span></span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${paymentMethod === 'shop' ? 'border-[#4b43e8]' : 'border-[#c8cbd5]'}`}>{paymentMethod === 'shop' && <span className="h-2.5 w-2.5 rounded-full bg-[#4b43e8]"/>}</span>
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f8f9fc] p-3 text-xs leading-relaxed text-[#667085]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#4b43e8]"/><span>{paymentMethod === 'online' ? 'You will be redirected to Razorpay Checkout. On supported mobile browsers, choosing UPI can open an installed UPI app. Your order is confirmed as paid only after the backend verifies the payment.' : 'Your print job will be created and marked as awaiting cash payment approval by the shop.'}</span></div>
            {pendingOnlinePayment && <div className="mt-3 rounded-xl border border-[#f0d9a7] bg-[#fffaf0] p-3"><strong className="block text-sm text-[#8a5a00]">Online payment awaiting confirmation</strong><p className="mt-1 text-xs leading-relaxed text-[#8a6b36]">If you have already approved the payment in your UPI app, check its status before trying again.</p><Button type="button" variant="outline" className="mt-2 w-full" onClick={checkPendingPayment} disabled={submitting}>{submitting ? 'Checking…' : 'Check payment status'}</Button></div>}
            {paymentMessage && <p role="status" className="mt-3 text-xs leading-relaxed text-[#667085]">{paymentMessage}</p>}
          </section>

          {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-sm text-[#b42336]">{error}</p>}
          <div className="sticky bottom-2 z-20 rounded-2xl border border-[#e7e8ef] bg-white/95 p-3 shadow-[0_8px_28px_rgba(30,36,70,.12)] backdrop-blur"><div className="mb-2 flex items-center justify-between"><span className="text-sm text-[#70778a]">{serverAmount != null ? 'Amount payable' : 'Estimated total'}</span><strong className="text-lg">₹{serverAmount != null ? serverAmount : totals.total}</strong></div><Button type="submit" className="w-full" disabled={submitting || !allConfigured || Boolean(pendingOnlinePayment && paymentMethod === 'shop')}>{submitting ? <><LoaderCircle size={17} className="animate-spin"/> Processing…</> : paymentMethod === 'online' ? `Continue to Pay · ₹${serverAmount != null ? serverAmount : totals.total}` : 'Place Order · Pay at Shop'}</Button></div>
        </form>
      </PageShell>
    </>
  );
}

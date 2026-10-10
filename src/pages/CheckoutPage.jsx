import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ChevronDown, ChevronUp, FileText, Image as ImageIcon,
  Layers3, Minus, Paperclip, Plus, RectangleHorizontal, RectangleVertical, Scissors, Trash2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import OptionGroup from '../components/printing/OptionGroup';
import ChoiceGrid from '../components/printing/ChoiceGrid';
import DocumentPreview from '../components/printing/DocumentPreview';
import PhotoPrintPreview from '../components/printing/PhotoPrintPreview';
import PrintQualityWarnings from '../components/printing/PrintQualityWarnings';
import { useOrder } from '../context/OrderContext';
import { prepareSelectedFiles } from '../utils/prepareSelectedFiles';
import { getPaperDimensions } from '../utils/printPreview';
import { getFilePrintCost, getOrderTotals, getSelectedPageCount } from '../utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { order, pricing, updateFileOptions, updateFile, removeFile, updateCustomer, setCheckoutPayment, submitJob, addFiles } = useOrder();
  const addFilesInputRef = useRef(null);
  const [addingFiles, setAddingFiles] = useState(false);
  const [expanded, setExpanded] = useState(() => ({}));
  const [sectionsOpen, setSectionsOpen] = useState({ price: true, details: true, payment: true });
  const [error, setError] = useState('');
  const [demoPaid, setDemoPaid] = useState(order.checkoutPayment?.status === 'mock-paid');
  const [submitting, setSubmitting] = useState(false);
  const totals = getOrderTotals(order.files, pricing);
  const paymentMethod = order.checkoutPayment?.method || 'shop';
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured && !(file.type !== 'photo' && file.options?.pageSelection === 'custom' && getSelectedPageCount(file) < 1));

  const toggle = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }));
  const handleAddFiles = async (event) => {
    const selected = Array.from(event.target.files || []); event.target.value = '';
    if (!selected.length) return;
    setAddingFiles(true); setError('');
    try { const result = await prepareSelectedFiles(selected); if (result.files.length) addFiles(result.files); if (result.errors.length) setError(result.errors.join(' ')); }
    catch (error) { console.error(error); setError('Could not prepare the selected files. Please try again.'); }
    finally { setAddingFiles(false); }
  };
  const toggleSection = (id) => setSectionsOpen((current) => ({ ...current, [id]: !current[id] }));
  const update = (file, key, value) => {
    const isPhoto = file.type === 'photo';
    if (isPhoto && key === 'photoLayout') {
      const paper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');
      updateFileOptions(file.id, value === 'single'
        ? { photoLayout: value, imageWidthMm: paper.width, imageHeightMm: paper.height }
        : { photoLayout: value, imageWidthMm: Number(file.options.imageWidthMm) >= paper.width ? 45 : (Number(file.options.imageWidthMm) || 45), imageHeightMm: Number(file.options.imageHeightMm) >= paper.height ? 45 : (Number(file.options.imageHeightMm) || 45) });
      return;
    }
    if (isPhoto && (key === 'paperSize' || key === 'orientation')) {
      const oldPaper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');
      const nextPaper = getPaperDimensions(key === 'paperSize' ? value : file.options.paperSize || 'A4', key === 'orientation' ? value : file.options.orientation || 'portrait');
      const width = Number(file.options.imageWidthMm);
      const height = Number(file.options.imageHeightMm);
      const single = (file.options.photoLayout || 'single') === 'single';
      const paperFrame = Math.abs(width - oldPaper.width) < .5 && Math.abs(height - oldPaper.height) < .5;
      updateFileOptions(file.id, single || paperFrame
        ? { [key]: value, imageWidthMm: nextPaper.width, imageHeightMm: nextPaper.height, crop: { x: 0, y: 0, zoom: 1, rect: { left: .05, top: .05, right: .95, bottom: .95 } } }
        : { [key]: value, crop: { ...(file.options.crop || { x: 0, y: 0, zoom: 1, rect: { left: .05, top: .05, right: .95, bottom: .95 } }), x: 0, y: 0 } });
      return;
    }
    updateFileOptions(file.id, { [key]: value });
  };

  const paperOptionsFor = (file) => (file.type === 'photo' ? order.shop.photoSizes : order.shop.paperSizes).map((value) => ({ value, label: value }));
  const colorOptions = [
    order.shop.settings?.acceptsBw !== false ? { value: 'bw', label: 'Black & White', icon: <span className="bw-dot" /> } : null,
    order.shop.settings?.acceptsColor !== false ? { value: 'color', label: 'Colour', icon: <span className="color-dot" /> } : null,
  ].filter(Boolean);
  const sideOptions = [
    order.shop.settings?.acceptsSingle !== false ? { value: 'single', label: 'Single-sided' } : null,
    order.shop.settings?.acceptsDouble !== false ? { value: 'double', label: 'Double-sided' } : null,
  ].filter(Boolean);
  const finishingOptions = [
    order.shop.settings?.lamination !== false ? ['lamination', 'Lamination', Scissors] : null,
    order.shop.settings?.binding !== false ? ['binding', 'Binding', Layers3] : null,
    order.shop.settings?.stapling !== false ? ['stapling', 'Stapling', Paperclip] : null,
  ].filter(Boolean);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!order.files.length) { setError('Add at least one file to continue.'); return; }
    if (!allConfigured) { setError('Please complete the settings for each file and check any custom page ranges.'); setExpanded((current) => ({ ...current, ...Object.fromEntries(order.files.map((file) => [file.id, true])) })); return; }
    if (!order.customer.name.trim() || !order.customer.phone.trim()) { setSectionsOpen((current) => ({ ...current, details: true })); setError('Enter your name and mobile number to identify the order.'); return; }
    if (paymentMethod !== 'shop' && !demoPaid) { setError('Complete the demo payment or choose Pay at shop.'); return; }
    setError('');
    setSubmitting(true);
    const jobId = submitJob();
    navigate(`/tracking/${jobId}`);
  };

  if (!order.files.length) {
    return <><Header showBack onBack={() => navigate('/')} /><PageShell><div className="rounded-2xl border border-[#e7e8ef] bg-white p-6 text-center"><h1 className="text-lg font-bold">Your checkout is empty</h1><p className="mt-2 text-sm text-[#70778a]">Select files or take a picture to start a print order.</p><Button className="mt-4 w-full" onClick={() => navigate('/upload')}>Add files</Button></div></PageShell></>;
  }

  return (
    <>
      <Header showBack onBack={() => navigate('/')} />
      <PageShell className="pb-28">
        <input ref={addFilesInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleAddFiles} aria-label="Add more files" />
        <div className="mb-5 mt-2">
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">PRINT & CHECKOUT</span>
          <h1 className="my-1 text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-tight tracking-[-.045em] text-[#171a24]">Review your print</h1>
          <p className="text-sm leading-relaxed text-[#70778a]">Your files, print settings, preview, price and payment are all here.</p>
        </div>

        <section className="mb-4 rounded-2xl border border-[#e7e8ef] bg-white p-3.5 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold">Your files <span className="text-sm font-medium text-[#7d879e]">({order.files.length})</span></h2><p className="mt-0.5 text-xs text-[#7d879e]">Open each file to edit its print settings.</p></div><button type="button" onClick={() => addFilesInputRef.current?.click()} disabled={addingFiles} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#dcd9ff] bg-[#f7f6ff] px-3 py-2 text-xs font-bold text-[#4b3ff5]"><Plus size={15}/> {addingFiles ? 'Adding…' : 'Add more'}</button></div>
          <div className="flex flex-col gap-2">
            {order.files.map((file) => {
              const isOpen = Boolean(expanded[file.id]);
              const isPhoto = file.type === 'photo';
              const selectedPages = isPhoto ? 1 : getSelectedPageCount(file);
              const invalidRange = !isPhoto && file.options.pageSelection === 'custom' && selectedPages < 1;
              return (
                <article key={file.id} className="overflow-hidden rounded-xl border border-[#e9eaf1] bg-white">
                  <div className="flex items-center gap-3 p-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isPhoto ? 'bg-[#fff0f5] text-[#e83e75]' : 'bg-[#eef0ff] text-[#4b43e8]'}`}>{isPhoto ? <ImageIcon size={19}/> : <FileText size={19}/>}</div>
                    <div className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm">{file.name}</strong><span className="mt-1 block text-[.68rem] text-[#7d879e]">{isPhoto ? `${file.options.paperSize} photo · ${file.options.copies} copies` : `${selectedPages}/${file.pages} pages · ${file.options.paperSize} · ${file.options.copies} copies`}</span></div>
                    <strong className="shrink-0 text-sm">₹{getFilePrintCost(file, pricing)}</strong>
                    <button type="button" onClick={() => navigate(`/configure/${file.id}`, { state: { returnTo: '/checkout' } })} className="shrink-0 rounded-lg bg-[#f4f3ff] px-3 py-2 text-xs font-bold text-[#4b43e8]">Edit</button>
                    <button type="button" onClick={() => removeFile(file.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#9a5260] hover:bg-[#fff1f2]" aria-label={`Remove ${file.name}`}><Trash2 size={16}/></button>
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
            <div className="mt-2 flex justify-between border-t border-[#edf0f4] pt-3"><span className="font-semibold">Estimated total</span><strong className="text-xl">₹{totals.total}</strong></div>
          </div>}
        </section>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
            <button type="button" onClick={() => toggleSection('details')} className="flex w-full items-center justify-between text-left font-bold"><span>Your details</span>{sectionsOpen.details ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
            {sectionsOpen.details && <><p className="mt-1 text-xs text-[#7d879e]">No account required. These details identify your order.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold">Name *<input className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.name || ''} onChange={(e) => updateCustomer({name:e.target.value})} placeholder="Your name" autoComplete="name"/></label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold">Mobile number *<input className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.phone || ''} onChange={(e) => updateCustomer({phone:e.target.value})} placeholder="98765 43210" inputMode="tel" autoComplete="tel"/></label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-2">Email (optional)<input type="email" className="min-h-11 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal outline-none focus:border-[#7771ee]" value={order.customer.email || ''} onChange={(e) => updateCustomer({email:e.target.value})} placeholder="you@example.com" autoComplete="email"/></label>
            </div></>}
          </section>

          <section className="rounded-2xl border border-[#e7e8ef] bg-white p-4 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
            <button type="button" onClick={() => toggleSection('payment')} className="flex w-full items-center justify-between text-left font-bold"><span>Payment method</span>{sectionsOpen.payment ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button>
            {sectionsOpen.payment && <><div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[{id:'shop',label:'Pay at shop',hint:'Pay when collecting'},{id:'upi',label:'UPI',hint:'Frontend demo'},{id:'card',label:'Card',hint:'Frontend demo'}].map((method) => <button type="button" key={method.id} onClick={() => {setCheckoutPayment({method:method.id,status:method.id === 'shop' ? 'pending' : 'pending'});setDemoPaid(false);}} className={`rounded-xl border p-3 text-left transition ${paymentMethod === method.id ? 'border-[#4b3ff5] bg-[#f5f4ff] ring-1 ring-[#4b3ff5]' : 'border-[#e4e7ef] bg-white'}`}><strong className="block text-sm">{method.label}</strong><span className="mt-1 block text-[.68rem] text-[#7d879e]">{method.hint}</span></button>)}
            </div>
            {paymentMethod !== 'shop' && <div className="mt-3 rounded-xl bg-[#f7f7ff] p-3"><p className="text-xs leading-relaxed text-[#646c80]">This frontend demo does not charge real money. Mark the simulated payment complete to continue, or choose Pay at shop.</p><button type="button" onClick={() => {setDemoPaid(true);setCheckoutPayment({method:paymentMethod,status:'mock-paid'});}} className={`mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${demoPaid ? 'bg-[#e6f8ed] text-[#16834b]' : 'bg-[#4b3ff5] text-white'}`}>{demoPaid ? <><Check size={14}/> Demo payment complete</> : 'Complete demo payment'}</button></div>}</>}
          </section>

          {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-sm text-[#b42336]">{error}</p>}
          <div className="sticky bottom-2 z-20 rounded-2xl border border-[#e7e8ef] bg-white/95 p-3 shadow-[0_8px_28px_rgba(30,36,70,.12)] backdrop-blur"><div className="mb-2 flex items-center justify-between"><span className="text-sm text-[#70778a]">Total to pay</span><strong className="text-lg">₹{totals.total}</strong></div><Button type="submit" className="w-full" disabled={submitting || !allConfigured || (paymentMethod !== 'shop' && !demoPaid)}>{submitting ? 'Submitting…' : 'Submit print order'}</Button></div>
        </form>
      </PageShell>
    </>
  );
}

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ClipboardList, FileText, Search, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';
import { getSelectedPageCount } from '../utils';
import { mockStatusOrders } from '../data/statusData';

const statusSteps = [
  { key: 'submitted', label: 'Submitted', description: 'Your print request has been received.' },
  { key: 'processing', label: 'Processing', description: 'Your files are being prepared.' },
  { key: 'printing', label: 'Printing', description: 'Your print job is currently being printed.' },
  { key: 'ready', label: 'Ready for Collection', description: 'Your prints are ready for collection.' },
  { key: 'completed', label: 'Completed', description: 'Your order has been completed.' },
];

function normalize(value) {
  return value.trim().toUpperCase();
}

function findStatusOrder(value, currentOrder, orders) {
  const query = normalize(value);
  if (!query) return null;

  const storedOrder = currentOrder.job.id && query === currentOrder.job.id.toUpperCase()
    ? orders.find((item) => item.id === currentOrder.job.id)
    : null;

  if (storedOrder) {
    return {
      jobId: storedOrder.id,
      phone: storedOrder.customer?.phone || currentOrder.customer.phone,
      shopName: storedOrder.shop?.name || currentOrder.shop.name,
      shopLocation: storedOrder.shop?.location || currentOrder.shop.location,
      status: storedOrder.status || 'processing',
      files: storedOrder.files?.length || 0,
      pages: storedOrder.pages || 0,
      copies: storedOrder.files?.reduce((sum, file) => sum + (Number(file.copies) || 1), 0) || 0,
    };
  }

  const digits = query.replace(/\D/g, '');
  return mockStatusOrders.find((item) =>
    item.jobId === query || (digits.length >= 10 && item.phone === digits)
  ) || null;
}

export default function StatusPage() {
  const navigate = useNavigate();
  const { order, orders } = useOrder();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const result = useMemo(() => findStatusOrder(query, order, orders), [query, order, orders]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearched(true);
  };

  const activeResult = searched ? result : null;
  const activeIndex = activeResult
    ? Math.max(0, statusSteps.findIndex((step) => step.key === activeResult.status))
    : -1;

  return (
    <>
      <Header showBack onBack={() => navigate('/')} />
      <PageShell className="status-page">
        <div className="page-intro compact">
          <span className="step-label">ORDER STATUS</span>
          <h1>Check your print status</h1>
          <p>Enter your order ID or mobile number to see the latest status.</p>
        </div>

        <form className="status-search-card" onSubmit={handleSearch}>
          <label htmlFor="status-query">Order ID or mobile number</label>
          <div className="status-search-row">
            <div className="status-input-wrap">
              <Search size={18} />
              <input
                id="status-query"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearched(false);
                }}
                placeholder="PN-10482 or 98765 43210"
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={!query.trim()}>Check</Button>
          </div>
          <span className="status-search-hint">Use the mobile number you entered while placing the order.</span>
        </form>

        {searched && !activeResult && (
          <div className="status-not-found" role="alert">
            <div className="status-not-found-icon"><Search size={18} /></div>
            <div>
              <strong>No order found</strong>
              <p>Check the order ID or mobile number and try again.</p>
            </div>
          </div>
        )}

        {activeResult && (
          <section className="status-result" aria-live="polite">
            <div className="status-result-head">
              <div>
                <span className="eyebrow">PRINT JOB</span>
                <h2>{activeResult.jobId}</h2>
              </div>
              <div className={`status-pill status-${activeResult.status}`}>
                {activeResult.status === 'action_required' ? 'Action required' : activeResult.status === 'cancelled' ? 'Cancelled' : statusSteps[activeIndex]?.label || 'Processing'}
              </div>
            </div>

            <div className="status-shop-row">
              <Store size={19} />
              <div><strong>{activeResult.shopName}</strong><span>{activeResult.shopLocation}</span></div>
            </div>

            {['action_required','cancelled'].includes(activeResult.status) ? <div className="status-alert-state"><AlertTriangle size={18}/><div><strong>{activeResult.status === 'action_required' ? 'Action required' : 'Order cancelled'}</strong><p>{activeResult.status === 'action_required' ? 'Please contact the shop for the next step.' : 'This print request is no longer active.'}</p></div></div> : <div className="status-timeline">
              {statusSteps.map((step, index) => {
                const done = index < activeIndex;
                const current = index === activeIndex;
                return (
                  <div className={`status-step ${done ? 'done' : ''} ${current ? 'current' : ''}`} key={step.key}>
                    <div className="status-step-marker">{done || current ? <Check size={14} /> : index + 1}</div>
                    <div className="status-step-copy">
                      <strong>{step.label}</strong>
                      <span>{current ? 'Current status' : step.description}</span>
                    </div>
                    {index < statusSteps.length - 1 && <div className={`status-step-line ${index < activeIndex ? 'done' : ''}`} />}
                  </div>
                );
              })}
            </div>}

            <div className="status-summary-grid">
              <div><span>Files</span><strong>{activeResult.files}</strong></div>
              <div><span>Pages</span><strong>{activeResult.pages}</strong></div>
              <div><span>Copies</span><strong>{activeResult.copies}</strong></div>
            </div>

            <div className="status-help">
              <FileText size={17} />
              <p>{activeResult.status === 'action_required' ? 'The shop needs your attention before printing can continue.' : activeResult.status === 'cancelled' ? 'This print request is no longer active.' : statusSteps[activeIndex]?.description}</p>
            </div>
          </section>
        )}

        <button className="status-back-home" type="button" onClick={() => navigate('/')}>
          <ClipboardList size={16} /> Start a new print order
        </button>
      </PageShell>
    </>
  );
}

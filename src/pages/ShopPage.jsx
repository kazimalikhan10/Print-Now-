import { ArrowRight, Clock3, MapPin, Plus, Upload, Printer, Image as ImageIcon, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { useOrder } from '../context/OrderContext';
import { formatBusinessHours, getShopOpenStatus } from '../utils/shopHours';

export default function ShopPage() {
  const navigate = useNavigate();
  const { order } = useOrder();
  const [shopStatus, setShopStatus] = useState(() => getShopOpenStatus(order.shop));

  useEffect(() => {
    const refresh = () => setShopStatus(getShopOpenStatus(order.shop));
    refresh();
    const timer = window.setInterval(refresh, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [order.shop]);

  const todayHours = formatBusinessHours(shopStatus.hours);

  return (
    <>
      <Header />
      <PageShell>
        <div className="shop-hero">
          <div className="shop-photo">
            <div className="shop-photo-label">ABC Digital Prints</div>
          </div>
          <div className="shop-card">
            <div className="shop-logo">ABC</div>
            <h1>{order.shop.name}</h1>
            <p className="shop-location"><MapPin size={15} /> {order.shop.location}</p>
            <div className="shop-open-row">
              <span className={`shop-open-badge ${shopStatus.isOpen ? '' : 'closed'}`}><i /> {shopStatus.label}</span>
              <span><Clock3 size={13}/> {todayHours}</span>
            </div>
          </div>
        </div>

        <section className="start-section">
          <div className="eyebrow">PRINT FROM YOUR PHONE</div>
          <h2>Print Your Files</h2>
          <p>Upload your documents or photos and choose how you want them printed.</p>
          <Button className="wide-button" onClick={() => navigate('/upload')}>
            <Plus size={20} /> Upload Files
          </Button>
          <div className="landing-links"><button className="check-status-button" type="button" onClick={() => navigate('/status')}>Check order status <ArrowRight size={16} /></button></div>
        </section>

        <section className="landing-services">
          <div className="landing-services-head"><div><span className="eyebrow">AVAILABLE HERE</span><h2>Print services</h2></div><span className={`shop-service-status ${shopStatus.isOpen ? '' : 'closed'}`}><i /> {shopStatus.isOpen ? 'Open' : 'Closed'}</span></div>
          <div className="landing-service-grid">
            <div><span className="type-icon"><FileText size={19} /></span><strong>Documents</strong><small>PDF and common office files</small></div>
            {order.shop.settings?.photoPrinting && <div><span className="type-icon"><ImageIcon size={19} /></span><strong>Photos</strong><small>Photo prints with framing</small></div>}
            <div><span className="type-icon"><Printer size={19} /></span><strong>{order.shop.settings?.acceptsColor && order.shop.settings?.acceptsBw ? 'Colour & B&W' : order.shop.settings?.acceptsColor ? 'Colour printing' : 'B&W printing'}</strong><small>{order.shop.settings?.acceptsDouble ? 'Single or double-sided' : 'Single-sided printing'}</small></div>
            <div><span className="type-icon"><Upload size={19} /></span><strong>Multiple files</strong><small>Upload in one order</small></div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

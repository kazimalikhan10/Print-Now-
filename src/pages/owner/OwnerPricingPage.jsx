import { Save } from 'lucide-react';
import { useState } from 'react';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';

export default function OwnerPricingPage() {
  const { pricing, setPricing } = useOrder();
  const [draft, setDraft] = useState(pricing);
  const updatePaper = (size, key, value) => setDraft((p) => ({ ...p, paper: { ...p.paper, [size]: { ...p.paper[size], [key]: Number(value) } } }));
  const updatePhoto = (size, value) => setDraft((p) => ({ ...p, photos: { ...p.photos, [size]: Number(value) } }));
  const save = () => setPricing(draft);
  return <OwnerShell title="Pricing">
    <div className="pricing-intro"><div><span className="owner-eyebrow">SHOP PRICING</span><h2>Set what customers pay</h2><p>These rates power both the customer total and the owner order view.</p></div><button className="owner-primary-button" onClick={save}><Save size={17}/> Save pricing</button></div>
    <section className="pricing-card"><div className="pricing-card-head"><div><h3>Document printing</h3><p>Price per printed page, before copies.</p></div></div><div className="pricing-grid pricing-grid-head"><span>Paper</span><span>B&W single</span><span>B&W double</span><span>Colour single</span><span>Colour double</span></div>{Object.entries(draft.paper).map(([size, values]) => <div className="pricing-grid" key={size}><strong>{size}</strong>{['bwSingle','bwDouble','colorSingle','colorDouble'].map((key) => <label className="pricing-cell" key={key}><span className="pricing-mobile-label">{key === 'bwSingle' ? 'B&W · Single' : key === 'bwDouble' ? 'B&W · Double' : key === 'colorSingle' ? 'Colour · Single' : 'Colour · Double'}</span><input type="number" min="0" step="0.5" value={values[key]} onChange={(e) => updatePaper(size, key, e.target.value)}/></label>)}</div>)}</section>
    <section className="pricing-card"><div><h3>Photo printing</h3><p>Price per photo/print.</p></div><div className="photo-pricing-grid">{Object.entries(draft.photos).map(([size, value]) => <label key={size}><span>{size}</span><div><span>₹</span><input type="number" min="0" step="1" value={value} onChange={(e) => updatePhoto(size, e.target.value)}/></div></label>)}</div></section>
  </OwnerShell>;
}

import { Package, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import OwnerShell from '../../components/layout/OwnerShell';
import { getInventory, saveInventory, DEFAULT_INVENTORY } from '../../services/inventoryService';
import { useOrder } from '../../context/OrderContext';

export default function OwnerInventoryPage() {
  const [stock, setStock] = useState(() => getInventory() || DEFAULT_INVENTORY);
  const [saved, setSaved] = useState(false);
  const { addNotification } = useOrder();

  const save = () => {
    saveInventory(stock);
    setSaved(true);
    const low = Object.entries(stock).filter(([, value]) => value < 25).map(([size]) => size);
    addNotification({ type: 'inventory', title: low.length ? 'Low inventory alert' : 'Inventory updated', message: low.length ? `${low.join(', ')} stock is below 25%.` : 'Paper stock levels were updated.' });
    window.setTimeout(() => setSaved(false), 1800);
  };


  return (
    <OwnerShell title="Inventory">
      <div className="pricing-intro">
        <div>
          <span className="owner-eyebrow">PAPER STOCK</span>
          <h2>Keep an eye on supplies</h2>
          <p>Frontend-only stock tracking for the shop team.</p>
        </div>
        <button className="owner-primary-button" onClick={save}>
          <Save size={17} /> {saved ? 'Saved' : 'Save stock'}
        </button>
      </div>
      <div className="inventory-grid">
        {Object.entries(stock).map(([size, value]) => (
          <section className="inventory-card" key={size}>
            <div className="inventory-icon"><Package size={20} /></div>
            <strong>{size}</strong>
            <span>{value}% remaining</span>
            <input type="range" min="0" max="100" value={value} onChange={(e) => setStock((current) => ({ ...current, [size]: Number(e.target.value) }))} />
            <div className="inventory-meter"><span style={{ width: `${value}%` }} /></div>
            <small>{value < 25 ? 'Low stock' : value < 50 ? 'Watch stock' : 'Stock looks healthy'}</small>
          </section>
        ))}
      </div>
    </OwnerShell>
  );
}

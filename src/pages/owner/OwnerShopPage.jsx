import { Check, Copy, Download, Printer, QrCode, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import OwnerShell from '../../components/layout/OwnerShell';
import { useOrder } from '../../context/OrderContext';
import { SHOP_DAYS, formatBusinessHours } from '../../utils/shopHours';

const capabilityLabels = { color: 'Colour printing', bw: 'Black & white', single: 'Single-sided', double: 'Double-sided', photo: 'Photo printing', lamination: 'Lamination', binding: 'Binding', stapling: 'Stapling' };
const paperKeys = { A4: 'a4', A5: 'a5', A6: 'a6', A3: 'a3' };
export default function OwnerShopPage() {
  const { order, updateShopSettings } = useOrder();
  const [settings, setSettings] = useState({ ...order.shop.settings, ...Object.fromEntries(Object.entries(paperKeys).map(([size,key])=>[key, order.shop.paperSizes?.includes(size)])), businessHours: order.shop.businessHours });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setSettings({ ...order.shop.settings, ...Object.fromEntries(Object.entries(paperKeys).map(([size,key])=>[key, order.shop.paperSizes?.includes(size)])), businessHours: order.shop.businessHours }); }, [order.shop]);
  const toggle = (key) => { setSaved(false); setSettings(s => ({ ...s, [key]: !s[key] })); };
  const updateHours = (day, field, value) => { setSaved(false); setSettings(s => ({ ...s, businessHours: { ...(s.businessHours || {}), [day]: { ...(s.businessHours?.[day] || {}), [field]: value } } })); };
  const toggleDayClosed = (day) => { setSaved(false); setSettings(s => ({ ...s, businessHours: { ...(s.businessHours || {}), [day]: { ...(s.businessHours?.[day] || {}), closed: !(s.businessHours?.[day]?.closed) } } })); };
  const save = () => { updateShopSettings(settings); setSaved(true); window.setTimeout(()=>setSaved(false),1800); };
  const shopLink = `printnow.local/shop/${order.shop.id}`;
  const downloadQr = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700"><rect width="700" height="700" fill="white"/><rect x="40" y="40" width="620" height="620" fill="none" stroke="#111827" stroke-width="8"/><text x="350" y="310" text-anchor="middle" font-family="Arial" font-size="54" font-weight="700">PRINT NOW</text><text x="350" y="380" text-anchor="middle" font-family="Arial" font-size="26">${order.shop.logo || 'SHOP'}</text><text x="350" y="445" text-anchor="middle" font-family="Arial" font-size="18">${shopLink}</text></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${order.shop.id}-print-now-qr.svg`; anchor.click();
    URL.revokeObjectURL(url);
  };
  const copyShopLink = async () => { try { await navigator.clipboard?.writeText(shopLink); setCopied(true); window.setTimeout(()=>setCopied(false),1600); } catch { setCopied(false); } };
  const printQr = () => window.print();
  return <OwnerShell title="Shop Settings"><div className="settings-grid">
    <section className="settings-card"><span className="owner-eyebrow">SHOP PROFILE</span><h2>{order.shop.name}</h2><p>{order.shop.location}</p><div className="settings-field"><label>Shop phone</label><input value={order.shop.phone} readOnly /></div><div className="settings-field"><label>Shop ID</label><input value={order.shop.id} readOnly /></div></section>
    <section className="settings-card"><span className="owner-eyebrow">PAPER SIZES</span><h2>Available paper</h2>{Object.entries(paperKeys).map(([size,key])=><label className="toggle-row" key={key}><span>{size} paper</span><button type="button" className={`toggle ${settings[key]?'on':''}`} onClick={()=>toggle(key)} aria-pressed={settings[key]}><span/></button></label>)}<div className="settings-note">Customers will only see enabled paper sizes.</div></section>
    <section className="settings-card"><span className="owner-eyebrow">BUSINESS HOURS</span><h2>When customers can print</h2><p className="settings-note">The customer landing page calculates Open now / Closed now from these hours using the shop time zone ({order.shop.timeZone || 'Asia/Kolkata'}).</p><div className="business-hours-list">{SHOP_DAYS.map(([day, label]) => { const value = settings.businessHours?.[day] || { open: '09:00', close: '21:00', closed: false }; return <div className="business-hours-row" key={day}><strong>{label}</strong><input aria-label={`${label} opening time`} type="time" value={value.open} disabled={value.closed} onChange={(e)=>updateHours(day,'open',e.target.value)} /><span>to</span><input aria-label={`${label} closing time`} type="time" value={value.close} disabled={value.closed} onChange={(e)=>updateHours(day,'close',e.target.value)} /><button type="button" className={`owner-secondary-button hours-toggle ${value.closed ? 'selected' : ''}`} onClick={()=>toggleDayClosed(day)}>{value.closed ? 'Closed' : 'Open'}</button></div>; })}</div><div className="settings-note">Example: 09:00–21:00 means the shop is open from 9 AM until 9 PM. Overnight ranges such as 18:00–02:00 are supported.</div></section>
    <section className="settings-card"><span className="owner-eyebrow">PRINT CAPABILITIES</span><h2>What this shop offers</h2>{Object.entries(capabilityLabels).map(([key,label])=><label className="toggle-row" key={key}><span>{label}</span><button type="button" className={`toggle ${settings[key]?'on':''}`} onClick={()=>toggle(key)} aria-pressed={settings[key]}><span/></button></label>)}<button className={`owner-primary-button full ${saved?'saved-button':''}`} onClick={save}>{saved?<Check size={17}/>:<Save size={17}/>} {saved?'Settings saved':'Save settings'}</button></section>
    <section className="settings-card qr-card"><span className="owner-eyebrow">CUSTOMER ENTRY</span><h2>Shop QR code</h2><div className="qr-placeholder"><QrCode size={94}/></div><p>Customers scan this code to open this shop's Print Now landing page.</p><div className="qr-link-box">{shopLink}</div><div className="qr-actions"><button className="owner-secondary-button" onClick={copyShopLink}><Copy size={16}/> {copied?'Copied':'Copy link'}</button><button className="owner-secondary-button" onClick={printQr}><Printer size={16}/> Print QR</button><button className="owner-secondary-button" onClick={downloadQr}><Download size={16}/> Download QR</button></div><div className="qr-print-sheet"><QrCode size={240}/><h1>{order.shop.name}</h1><p>{shopLink}</p></div></section>
  </div></OwnerShell>;
}

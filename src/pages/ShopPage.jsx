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
  const serviceStatusClass = shopStatus.isOpen ? 'bg-[#eaf8ef] text-[#168b4b]' : 'bg-[#eaf8ef] text-[#168b4b] opacity-[.82]';

  return (
    <>
      <Header />
      <PageShell>
        <div className="relative -mx-[14px] -mt-6 min-[700px]:mx-0 min-[700px]:-mt-[34px]">
          <div className="relative h-[250px] overflow-hidden bg-[linear-gradient(145deg,#2f3944,#9e816a_48%,#e8e4dd)] min-[700px]:h-[310px] min-[700px]:rounded-b-[24px]">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_30%,rgba(0,0,0,.42))]" aria-hidden="true" />
            <div className="absolute bottom-5 left-[18px] text-[1.15rem] font-semibold text-white">ABC Digital Prints</div>
          </div>
          <div className="relative mx-4 -mt-[30px] rounded-[20px] bg-white px-5 pb-[18px] pt-[22px] shadow-[0_12px_34px_rgba(30,36,70,.10)] min-[700px]:mx-auto min-[700px]:-mt-[38px] min-[700px]:max-w-[560px]">
            <div className="mx-auto -mt-[50px] mb-3 grid h-[62px] w-[62px] place-items-center rounded-full border-[5px] border-white bg-[#e9efff] text-[.95rem] font-extrabold text-[#2737c9] shadow-[0_5px_18px_rgba(0,0,0,.12)]">ABC</div>
            <h1 className="m-0 text-center text-[1.25rem] tracking-[-.03em]">{order.shop.name}</h1>
            <p className="mt-[7px] flex items-center justify-center gap-[5px] text-[.78rem] text-[#6d7485]"><MapPin size={15} /> {order.shop.location}</p>
            <div className="mt-[9px] flex flex-wrap items-center gap-[9px] text-[.62rem] text-[#7a8190] max-[520px]:gap-[6px]">
              <span className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[5px] font-[750] ${shopStatus.isOpen ? 'bg-[#eaf8ef] text-[#168b4b]' : 'bg-[#eaf8ef] text-[#168b4b] opacity-[.82]'}`}>
                <i className={`h-[6px] w-[6px] rounded-full ${shopStatus.isOpen ? 'bg-[#19a85a]' : 'bg-[#ef4444]'}`} /> {shopStatus.label}
              </span>
              <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {todayHours}</span>
            </div>
          </div>
        </div>

        <section className="px-1 pb-2 pt-7 min-[700px]:mx-auto min-[700px]:max-w-[560px]">
          <div className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">PRINT FROM YOUR PHONE</div>
          <h2 className="mb-2 mt-[5px] text-[1.55rem] font-semibold tracking-[-.045em]">Print Your Files</h2>
          <p className="mb-[18px] max-w-[500px] text-[.9rem] leading-[1.55] text-[#667085]">Upload your documents or photos and choose how you want them printed.</p>
          <Button className="w-full" onClick={() => navigate('/upload')}>
            <Plus size={20} /> Upload Files
          </Button>
          <div className="mx-auto flex max-w-[560px] flex-wrap items-center justify-center gap-3 max-[520px]:grid max-[520px]:grid-cols-2">
            <button
              className="col-span-full mt-2 inline-flex min-h-[46px] w-full items-center justify-center gap-[7px] rounded-[13px] border border-[#deddfb] bg-white text-[.78rem] font-bold text-[#4b46e8] transition hover:border-[#bcb9ff] hover:bg-[#f8f7ff] active:scale-[.99]"
              type="button"
              onClick={() => navigate('/status')}
            >
              Check order status <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="mt-[18px]">
          <div className="mb-[9px] flex items-end justify-between gap-3">
            <div>
              <div className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">AVAILABLE HERE</div>
              <h2 className="mb-0 mt-[3px] text-[1rem] tracking-[-.025em]">Print services</h2>
            </div>
            <span className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[5px] text-[.56rem] font-extrabold ${serviceStatusClass}`}>
              <i className={`h-[6px] w-[6px] rounded-full ${shopStatus.isOpen ? 'bg-[#19a85a]' : 'bg-[#ef4444]'}`} /> {shopStatus.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 min-[761px]:grid-cols-4 max-[420px]:gap-[6px]">
            <div className="grid min-w-0 gap-1 rounded-[13px] border border-[#e7e8ef] bg-white p-3 max-[420px]:px-2.5 max-[420px]:py-2.5">
              <span className="mb-1 grid h-8 w-8 place-items-center rounded-[9px] bg-[#eef0ff] text-[#4a43e8]"><FileText size={19} /></span>
              <strong className="text-[.67rem]">Documents</strong>
              <small className="text-[.56rem] leading-[1.35] text-[#808797]">PDF and common office files</small>
            </div>
            {order.shop.settings?.photoPrinting && (
              <div className="grid min-w-0 gap-1 rounded-[13px] border border-[#e7e8ef] bg-white p-3 max-[420px]:px-2.5 max-[420px]:py-2.5">
                <span className="mb-1 grid h-8 w-8 place-items-center rounded-[9px] bg-[#eef0ff] text-[#4a43e8]"><ImageIcon size={19} /></span>
                <strong className="text-[.67rem]">Photos</strong>
                <small className="text-[.56rem] leading-[1.35] text-[#808797]">Photo prints with framing</small>
              </div>
            )}
            <div className="grid min-w-0 gap-1 rounded-[13px] border border-[#e7e8ef] bg-white p-3 max-[420px]:px-2.5 max-[420px]:py-2.5">
              <span className="mb-1 grid h-8 w-8 place-items-center rounded-[9px] bg-[#eef0ff] text-[#4a43e8]"><Printer size={19} /></span>
              <strong className="text-[.67rem]">{order.shop.settings?.acceptsColor && order.shop.settings?.acceptsBw ? 'Colour & B&W' : order.shop.settings?.acceptsColor ? 'Colour printing' : 'B&W printing'}</strong>
              <small className="text-[.56rem] leading-[1.35] text-[#808797]">{order.shop.settings?.acceptsDouble ? 'Single or double-sided' : 'Single-sided printing'}</small>
            </div>
            <div className="grid min-w-0 gap-1 rounded-[13px] border border-[#e7e8ef] bg-white p-3 max-[420px]:px-2.5 max-[420px]:py-2.5">
              <span className="mb-1 grid h-8 w-8 place-items-center rounded-[9px] bg-[#eef0ff] text-[#4a43e8]"><Upload size={19} /></span>
              <strong className="text-[.67rem]">Multiple files</strong>
              <small className="text-[.56rem] leading-[1.35] text-[#808797]">Upload in one order</small>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

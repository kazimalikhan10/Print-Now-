import {
  ArrowRight,
  Camera,
  Clock3,
  FileText,
  History,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  UserCircle,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useOrder } from '../context/OrderContext';
import { formatBusinessHours, getShopOpenStatus } from '../utils/shopHours';
import shopFront from '../assets/shop-front.png';
import uploadHero from '../assets/upload-hero.png';

const services = [
  { title: 'Documents', subtitle: 'PDF, Word, etc.', icon: FileText, tone: 'bg-[#eef5ff] text-[#2d7df4]' },
  { title: 'Photos', subtitle: 'High quality', icon: ImageIcon, tone: 'bg-[#fff0f5] text-[#f23872]' },
  { title: 'ID Cards', subtitle: 'Student, Office & more', icon: UserCircle, tone: 'bg-[#fff7e9] text-[#f0a11a]' },
  { title: 'More', subtitle: 'Lamination, Spiral, etc.', icon: MoreHorizontal, tone: 'bg-[#f2efff] text-[#4a43e8]' },
];

const popularOptions = [
  { title: 'A4 B&W', subtitle: 'Documents', icon: FileText, tone: 'bg-[#f4f5f9] text-[#8b93a5]' },
  { title: '4x6 Color', subtitle: 'Photos', icon: ImageIcon, tone: 'bg-[#fff1f5] text-[#f23872]' },
  { title: 'Passport Photo', subtitle: 'ID Cards', icon: UserCircle, tone: 'bg-[#fff8ea] text-[#eea21b]' },
  { title: 'A3 Color', subtitle: 'Posters', icon: FileText, tone: 'bg-[#ecfaf3] text-[#159b61]' },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const { order, auth } = useOrder();
  const [shopStatus, setShopStatus] = useState(() => getShopOpenStatus(order.shop));
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setShopStatus(getShopOpenStatus(order.shop));
    refresh();
    const timer = window.setInterval(refresh, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [order.shop]);

  const todayHours = formatBusinessHours(shopStatus.hours);

  const openAccount = () => {
    if (auth.signedIn && auth.role === 'customer') {
      navigate('/profile');
      return;
    }
    if (auth.signedIn && auth.role === 'owner') {
      navigate('/owner');
      return;
    }
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-[#fbfcff] text-[#10152b]">
      <header className="sticky top-0 z-30 border-b border-[#edf0f6]/80 bg-[#fbfcff]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[70px] w-[calc(100%-28px)] max-w-[760px] items-center gap-2 px-1.2 py-3 sm:min-h-[68px]">
          <div className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[14px] bg-[#4b3ff5] text-[1.05rem] font-black text-white shadow-[0_8px_20px_rgba(75,63,245,.20)]">
            PN
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-w-0 border-0 bg-transparent p-0 text-left"
          >
            <div className="text-[1.25rem] font-extrabold leading-none tracking-[-.04em] sm:text-[1.4rem]">
              Print <span className="text-[#4b3ff5]">Now</span>
            </div>
            <div className="mt-0.5 text-[.68rem] font-medium tracking-[.01em] text-[#7d879e] sm:text-[.74rem]">
              Fast <span className="mx-1.5">•</span> Simple <span className="mx-1.5">•</span> Near You
            </div>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="grid h-[40px] w-[40px] place-items-center rounded-full border-0 bg-transparent text-[#4b3ff5] transition active:scale-[.96]"
              aria-label="Shop location"
              title={order.shop?.location || 'Shop location'}
            >
              <MapPin size={21} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={openAccount}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-[#edf0f6] bg-white text-[#111827] shadow-[0_4px_14px_rgba(30,36,70,.06)] transition active:scale-[.96]"
              aria-label={auth.signedIn ? 'Profile' : 'Sign in'}
              title={auth.signedIn ? 'Profile' : 'Sign in'}
            >
              <UserCircle size={22} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </header>

      <PageShell className="w-[calc(100%-28px)] max-w-[760px] pt-4 sm:pt-5">
        <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(30,36,70,.07)] ring-1 ring-[#edf0f6]">
          <div className="grid grid-cols-[1fr_43%] items-stretch sm:grid-cols-[1fr_38%]">
            <div className="flex flex-col justify-center px-5 py-5 sm:px-7 sm:py-6">
              <h1 className="text-[1.22rem] font-extrabold tracking-[-.035em] sm:text-[1.45rem]">{order.shop.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-[.78rem] text-[#778197] sm:text-[.86rem]">
                <MapPin size={17} className="shrink-0 text-[#7b8497]" />
                <span>{order.shop.location}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[.66rem] text-[#778197] sm:text-[.78rem]">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 font-semibold ${shopStatus.isOpen ? 'bg-[#eaf8ef] text-[#14904d]' : 'bg-[#fef0f0] text-[#d64b4b]'}`}>
                  <span className={`h-2 w-2 rounded-full ${shopStatus.isOpen ? 'bg-[#16a35b]' : 'bg-[#e15b5b]'}`} />
                  {shopStatus.label}
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Clock3 size={16} /> {todayHours}
                </span>
              </div>
            </div>
            <img
              src={shopFront}
              alt={`${order.shop.name} storefront`}
              className="h-full min-h-[172px] w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#f3f4ff] via-[#f8f9ff] to-[#f1f3ff] px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_36%] sm:gap-4">
            <div>
              <div className="text-[.62rem] font-bold tracking-[.16em] text-[#4b3ff5]">PRINT FROM YOUR PHONE</div>
              <h2 className="mt-1.5 text-[1.5rem] font-extrabold leading-[1.05] tracking-[-.05em] sm:text-[1.7rem]">Print Your Files</h2>
              <p className="mt-2 max-w-[310px] text-[.8rem] leading-[1.45] text-[#748099] sm:text-[.86rem]">
                Upload your documents or photos and choose how you want them printed.
              </p>
            </div>
            <img
              src={uploadHero}
              alt="Upload documents and photos"
              className="mx-auto w-full max-w-[135px] object-contain sm:max-w-[165px]"
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <h2 className="text-[1.15rem] font-extrabold tracking-[-.035em] sm:text-[1.3rem]">Print Services</h2>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-1 border-0 bg-transparent text-[.78rem] font-semibold text-[#4b3ff5] transition active:scale-[.97]"
            >
              See All <ArrowRight size={17} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {services.map(({ title, subtitle, icon: Icon, tone }) => (
              <button
                key={title}
                type="button"
                onClick={() => navigate('/upload')}
                className="min-w-0 rounded-[16px] border-0 bg-white px-2.5 py-3 text-left shadow-[0_5px_18px_rgba(30,36,70,.045)] ring-1 ring-[#eef0f5] transition active:scale-[.975] sm:px-3.5"
              >
                <span className={`mb-3 grid h-[34px] w-[34px] place-items-center rounded-[10px] ${tone}`}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <strong className="block text-[.66rem] font-bold leading-tight sm:text-[.78rem]">{title}</strong>
                <span className="mt-1 block text-[.59rem] leading-[1.3] text-[#7d879e] sm:text-[.68rem]">{subtitle}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 pb-28">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <h2 className="text-[1.15rem] font-extrabold tracking-[-.035em] sm:text-[1.3rem]">Popular Options</h2>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-1 border-0 bg-transparent text-[.78rem] font-semibold text-[#4b3ff5] transition active:scale-[.97]"
            >
              See All <ArrowRight size={17} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {popularOptions.map(({ title, subtitle, icon: Icon, tone }) => (
              <button
                key={title}
                type="button"
                onClick={() => navigate('/upload')}
                className="min-w-0 rounded-[16px] border-0 bg-white px-2.5 py-3 text-center shadow-[0_5px_18px_rgba(30,36,70,.045)] ring-1 ring-[#eef0f5] transition active:scale-[.975] sm:px-3.5"
              >
                <span className={`mx-auto mb-2.5 grid h-[34px] w-[34px] place-items-center rounded-[10px] ${tone}`}>
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <strong className="block text-[.66rem] font-bold leading-tight sm:text-[.8rem]">{title}</strong>
                <span className="mt-1 block text-[.61rem] text-[#7d879e]">{subtitle}</span>
              </button>
            ))}
          </div>
        </section>
      </PageShell>

      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:hidden">
        <div className="mx-auto grid max-w-[760px] grid-cols-3 items-end rounded-[24px] border border-[#edf0f6] bg-white/95 px-3 pb-2 pt-3 shadow-[0_-8px_30px_rgba(30,36,70,.10)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="grid justify-items-center gap-1 border-0 bg-transparent py-1 text-[#4b3ff5] active:scale-[.96]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#efedff]"><MapPin size={19} /></span>
            <span className="text-[.67rem] font-bold">Home</span>
          </button>
          <div className="relative -mt-9 grid justify-items-center py-1 text-[#10152b]">
            <div className="relative h-[64px] w-[64px]">
              <button
                type="button"
                onClick={() => setUploadMenuOpen((open) => !open)}
                className="relative z-20 grid h-[64px] w-[64px] place-items-center rounded-full border-0 bg-[#4b3ff5] text-white shadow-[0_10px_25px_rgba(75,63,245,.28)] ring-[6px] ring-[#fbfcff] transition-transform duration-200 active:scale-[.94]"
                aria-label={uploadMenuOpen ? 'Close upload options' : 'Open upload options'}
                aria-expanded={uploadMenuOpen}
              >
                <span className={`absolute inset-0 grid place-items-center transition-all duration-200 ${uploadMenuOpen ? 'rotate-90 scale-100 opacity-100' : 'rotate-0 scale-100 opacity-100'}`}>
                  {uploadMenuOpen ? <X size={27} strokeWidth={2.4} /> : <Upload size={28} />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/upload', { state: { openPicker: 'files' } })}
                className={`absolute left-1/2 top-1/2 z-10 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#e6e8f2] bg-white text-[#4b3ff5] shadow-[0_8px_22px_rgba(30,36,70,.12)] transition-all duration-1000 ease-in-out active:scale-[.94] ${uploadMenuOpen ? '-translate-x-[100px] -translate-y-[12px] scale-100 opacity-100' : '-translate-x-1/2 -translate-y-1/2 scale-75 opacity-0 pointer-events-none'}`}
                style={{ transitionDelay: uploadMenuOpen ? '0ms' : '100ms' }}
                aria-label="Select files"
              >
                <FileText size={19} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/upload', { state: { openPicker: 'camera' } })}
                className={`absolute left-1/2 top-1/2 z-10 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#e6e8f2] bg-white text-[#4b3ff5] shadow-[0_8px_22px_rgba(30,36,70,.12)] transition-all duration-1000 ease-in-out active:scale-[.94] ${uploadMenuOpen ? '-translate-x-1/2 -translate-y-[100px] scale-100 opacity-100' : '-translate-x-1/2 -translate-y-1/2 scale-75 opacity-0 pointer-events-none'}`}
                style={{ transitionDelay: uploadMenuOpen ? '100ms' : '0ms' }}
                aria-label="Click a picture"
              >
                <Camera size={20} strokeWidth={2} />
              </button>
            </div>
            <span className="text-[.68rem] font-bold">Upload Files</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/status')}
            className="grid justify-items-center gap-1 border-0 bg-transparent py-1 text-[#7d879e] active:scale-[.96]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f2f4f8]"><History size={21} /></span>
            <span className="text-[.67rem] font-semibold">Order Tracking</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

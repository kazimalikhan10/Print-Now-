import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import { useOrder } from '../context/OrderContext';

export default function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { order, updateCustomer } = useOrder();
  const allConfigured = order.files.length > 0 && order.files.every((file) => file.configured);
  const [error, setError] = useState('');

  if (!order.files.length || !allConfigured) { navigate('/files'); return null; }

  const handleContinue = (event) => {
    event.preventDefault();
    if (!order.customer.name.trim() || !order.customer.phone.trim()) { setError('Please enter your name and mobile number.'); return; }
    setError('');
    navigate('/confirmation');
  };

  const inputClass = 'min-h-[52px] w-full rounded-[13px] border border-[#dfe3eb] bg-white px-3.5 text-[.83rem] text-[#171b25] outline-none placeholder:text-[#a0a5b1] focus:border-[#7771ee] focus:ring-4 focus:ring-[rgba(75,70,232,.09)]';

  return (
    <>
      <Header showBack onBack={() => navigate('/summary')} />
      <PageShell>
        <StepIndicator current={5} />
        <div className="mb-[18px] mt-[10px]">
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">YOUR DETAILS</span>
          <h1 className="my-[5px] mb-[7px] text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-[1.1] tracking-[-.045em] text-[#171a24]">Almost there</h1>
          <p className="m-0 text-[.92rem] leading-[1.5] text-[#70778a]">We only need a couple of details so the shop can identify your order.</p>
        </div>

        <form className="mx-auto flex max-w-[560px] flex-col gap-[18px]" onSubmit={handleContinue}>
          <label className="flex flex-col gap-[7px]"><span className="text-[.73rem] font-[650] text-[#252b38]">Name *</span><input className={inputClass} value={order.customer.name} onChange={(e) => updateCustomer({ name: e.target.value })} placeholder="Your name" autoComplete="name" /></label>
          <label className="flex flex-col gap-[7px]"><span className="text-[.73rem] font-[650] text-[#252b38]">Mobile Number *</span><input className={inputClass} value={order.customer.phone} onChange={(e) => updateCustomer({ phone: e.target.value })} placeholder="98765 43210" inputMode="tel" autoComplete="tel" /></label>
          <label className="flex flex-col gap-[7px]"><span className="text-[.73rem] font-[650] text-[#252b38]">Email <em className="not-italic font-medium text-[#9197a5]">optional</em></span><input className={inputClass} value={order.customer.email} onChange={(e) => updateCustomer({ email: e.target.value })} placeholder="you@example.com" type="email" autoComplete="email" /></label>

          <div className="flex gap-2.5 rounded-[13px] border border-[#e8e8ff] bg-[#f6f7ff] p-[13px]">
            <span className="grid h-[23px] w-[23px] flex-none place-items-center rounded-full bg-[#e8e8ff] text-[.7rem] font-extrabold text-[#4338f2]">✓</span>
            <div><strong className="block text-[.73rem]">No account required</strong><p className="m-0 mt-[3px] text-[.66rem] leading-[1.45] text-[#737a8c]">You can print as a guest. Your details are only used for this order.</p></div>
          </div>

          {error && <div className="rounded-[10px] bg-[#fff2f2] px-3 py-[11px] text-[.72rem] text-[#c23838]">{error}</div>}
          <div className="mx-auto mt-1 w-full max-w-[560px]"><Button type="submit" className="w-full">Continue</Button></div>
        </form>
      </PageShell>
    </>
  );
}

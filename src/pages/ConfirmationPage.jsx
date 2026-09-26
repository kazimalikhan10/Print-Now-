import { ArrowLeft, Check, FileText, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import { useOrder } from '../context/OrderContext';
import { getOrderTotals } from '../utils';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { order, submitJob } = useOrder();
  const totals = getOrderTotals(order.files);
  const handleSubmit = () => { const jobId = submitJob(); navigate(`/tracking/${jobId}`); };

  return (
    <>
      <Header showBack onBack={() => navigate('/customer')} />
      <PageShell>
        <StepIndicator current={5} />
        <div className="mb-[18px] mt-[10px]">
          <span className="text-[.68rem] font-bold tracking-[.12em] text-[#4a43e8]">FINAL CHECK</span>
          <h1 className="my-[5px] mb-[7px] text-[clamp(1.55rem,5vw,2rem)] font-[750] leading-[1.1] tracking-[-.045em] text-[#171a24]">Ready to print?</h1>
          <p className="m-0 text-[.92rem] leading-[1.5] text-[#70778a]">Please review the order once before sending it to the shop.</p>
        </div>

        <div className="mx-auto flex max-w-[560px] flex-col items-center rounded-[20px] border border-[#e8e9f5] bg-[linear-gradient(180deg,#f8f8ff,#fff)] px-[18px] py-7 text-center">
          <div className="mb-[11px] grid h-[58px] w-[58px] place-items-center rounded-full bg-[#e6f8ed] text-[#159447]"><Check size={25} /></div>
          <strong className="text-base">{order.files.length} {order.files.length === 1 ? 'file' : 'files'}</strong>
          <span className="mt-1 text-[.7rem] text-[#73798a]">{totals.totalPages} total pages · {totals.totalCopies} total copies</span>
        </div>

        <div className="mx-auto mt-[11px] max-w-[560px] rounded-2xl border border-[#e7e9f0] bg-white px-[15px] py-2 shadow-[0_5px_18px_rgba(28,31,57,.035)]">
          <div className="flex justify-between gap-[15px] border-b border-[#f0f1f5] py-3 text-[.74rem] last:border-b-0"><span className="text-[#777e8e]">Estimated amount</span><strong className="text-right text-[#171b25]">₹{totals.total}</strong></div>
          <div className="flex justify-between gap-[15px] border-b border-[#f0f1f5] py-3 text-[.74rem] last:border-b-0"><span className="text-[#777e8e]">Customer</span><strong className="text-right text-[#171b25]">{order.customer.name}</strong></div>
          <div className="flex justify-between gap-[15px] border-b border-[#f0f1f5] py-3 text-[.74rem] last:border-b-0"><span className="text-[#777e8e]">Mobile</span><strong className="text-right text-[#171b25]">{order.customer.phone}</strong></div>
          <div className="flex justify-between gap-[15px] py-3 text-[.74rem]"><span className="text-[#777e8e]">Payment</span><strong className="text-right text-[#171b25]">{order.checkoutPayment?.method === 'shop' ? 'Pay at shop' : order.checkoutPayment?.status === 'mock-paid' ? 'Paid online · demo' : 'Payment pending'}</strong></div>
        </div>

        <div className="mx-auto mt-[11px] flex max-w-[560px] items-center gap-[11px] rounded-[15px] border border-[#e6e7ff] bg-[#f5f6ff] p-3.5 text-[#4a43e8]">
          <Store size={20} /><div className="min-w-0"><strong className="block text-[.75rem] text-[#202532]">{order.shop.name}</strong><span className="mt-0.5 block text-[.65rem] text-[#747b8d]">{order.shop.location}</span></div>
        </div>

        <div className="mx-auto mt-2.5 max-w-[560px] px-0.5">
          {order.files.map((file) => <div className="flex items-center gap-[7px] px-[3px] py-[7px] text-[.69rem] text-[#626a7b]" key={file.id}><FileText size={15} /><span>{file.name}</span></div>)}
        </div>

        <div className="mx-auto mt-7 w-full max-w-[560px]"><Button className="w-full" onClick={handleSubmit}>Submit Print Job</Button><button className="mx-auto mt-2.5 flex items-center justify-center gap-1.5 border-0 bg-transparent p-[7px] text-[.74rem] text-[#555d70]" onClick={() => navigate('/summary')}><ArrowLeft size={15} /> Go back & edit</button></div>
      </PageShell>
    </>
  );
}

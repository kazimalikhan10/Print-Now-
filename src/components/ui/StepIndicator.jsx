import { useLocation, useNavigate } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext';

const steps = ['Shop', 'Upload', 'Configure', 'Review', 'Submit'];

export default function StepIndicator({ current = 1 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { order } = useOrder();
  const hasFiles = order.files.length > 0;
  const allConfigured = hasFiles && order.files.every((file) => file.configured);
  const destinations = ['/', '/upload', '/files', '/summary', order.job.id ? '/confirmation' : '/customer'];
  const eligible = [true, true, hasFiles, allConfigured, allConfigured];

  return (
    <nav className="-mx-0.5 mb-[22px] flex items-start justify-between gap-[3px] px-0.5 min-[700px]:mx-auto min-[700px]:max-w-[560px]" aria-label={`Order progress, step ${current} of ${steps.length}`}>
      {steps.map((step, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'current' : '';
        const canNavigate = eligible[index] && destinations[index] !== location.pathname;
        return (
          <div className="relative flex min-w-0 flex-1 flex-col items-center gap-[5px]" key={step}>
            <button
              type="button"
              className={`relative z-10 flex flex-col items-center gap-[5px] border-0 bg-transparent p-0 ${canNavigate ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => canNavigate && navigate(destinations[index])}
              disabled={!eligible[index] || destinations[index] === location.pathname}
              aria-current={number === current ? 'step' : undefined}
              aria-label={`${step}${eligible[index] ? '' : ' (not available yet)'}`}
            >
              <span className={`grid h-[25px] w-[25px] place-items-center rounded-full text-[.62rem] font-bold ${state === 'current' ? 'bg-[#4a43e8] text-white shadow-[0_0_0_4px_#eeedff]' : state === 'done' ? 'bg-[#e7f8ee] text-[#159447]' : 'bg-[#f0f1f5] text-[#89909f]'}`}>{number < current ? '✓' : number}</span>
              <span className={`whitespace-nowrap text-[.56rem] ${state ? 'font-semibold text-[#4039d6]' : 'text-[#9298a6]'}`}>{step}</span>
            </button>
            {index < steps.length - 1 && <div className={`absolute left-[calc(50%+13px)] right-[calc(-50%+13px)] top-3 z-0 h-px ${number < current ? 'bg-[#9fd7b6]' : 'bg-[#e1e4eb]'}`} />}
          </div>
        );
      })}
    </nav>
  );
}

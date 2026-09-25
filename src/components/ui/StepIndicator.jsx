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
    <nav className="step-indicator" aria-label={`Order progress, step ${current} of ${steps.length}`}>
      {steps.map((step, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'current' : '';
        const canNavigate = eligible[index] && destinations[index] !== location.pathname;
        return (
          <div className="step-item" key={step}>
            <button
              type="button"
              className={`step-button ${state} ${canNavigate ? 'is-clickable' : ''}`}
              onClick={() => canNavigate && navigate(destinations[index])}
              disabled={!eligible[index] || destinations[index] === location.pathname}
              aria-current={number === current ? 'step' : undefined}
              aria-label={`${step}${eligible[index] ? '' : ' (not available yet)'}`}
            >
              <span className={`step-dot ${state}`}>{number < current ? '✓' : number}</span>
              <span className={state}>{step}</span>
            </button>
            {index < steps.length - 1 && <div className={`step-connector ${number < current ? 'done' : ''}`} />}
          </div>
        );
      })}
    </nav>
  );
}

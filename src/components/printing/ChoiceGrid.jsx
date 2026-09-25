export default function ChoiceGrid({ options, value, onChange }) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button type="button" key={option.value} className={`choice ${value === option.value ? 'selected' : ''}`} onClick={() => onChange(option.value)}>
          {option.icon && <span className="choice-icon">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

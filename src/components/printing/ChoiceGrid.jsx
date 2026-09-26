export default function ChoiceGrid({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button type="button" key={option.value} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[11px] border px-2 py-2 text-[.7rem] font-medium transition ${value === option.value ? 'border-[#7770ff] bg-[#f0efff] text-[#332cc8] shadow-[inset_0_0_0_1px_#7770ff]' : 'border-[#e1e4ec] bg-white text-[#333a4a]'}`} onClick={() => onChange(option.value)}>
          {option.icon && <span className="inline-flex items-center">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

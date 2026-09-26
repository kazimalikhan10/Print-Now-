export default function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="my-[5px] mb-[7px] text-[clamp(1.55rem,5vw,2rem)] font-semibold leading-[1.1] tracking-[-.045em]">{title}</h1>
        {subtitle && <p className="m-0 text-[.92rem] leading-[1.5] text-[#687085]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

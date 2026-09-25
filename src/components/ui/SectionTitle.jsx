export default function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

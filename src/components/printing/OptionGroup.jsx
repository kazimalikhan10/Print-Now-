export default function OptionGroup({ label, children }) {
  return <section className="option-group"><h3>{label}</h3>{children}</section>;
}

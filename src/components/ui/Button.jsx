const variants = {
  primary: 'bg-gradient-to-br from-[#4338f2] to-[#5146f5] text-white shadow-[0_8px_20px_rgba(67,56,242,0.18)]',
  outline: 'min-h-9 border border-[#aaa6ff] bg-white px-[11px] text-[.72rem] text-[#3d36d9]',
};

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`pn-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-0 px-[18px] text-[.88rem] font-[650] transition duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

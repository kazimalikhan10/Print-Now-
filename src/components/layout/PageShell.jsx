export default function PageShell({ children, className = '' }) {
  return (
    <main
      className={`mx-auto w-[calc(100%-28px)] max-w-[760px] py-6 pb-10 min-[700px]:pt-[34px] ${className}`}
    >
      {children}
    </main>
  );
}

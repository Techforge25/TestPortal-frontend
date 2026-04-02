type AdminFooterProps = {
  isDark: boolean;
};

export function AdminFooter({ isDark }: AdminFooterProps) {
  return (
    <footer
      className={`flex h-16 items-center justify-between border-t px-6 text-base ${
        isDark ? "border-slate-700 bg-slate-900 text-slate-300" : "border-[#e2e8f0] bg-white text-[#666c77]"
      }`}
    >
      <p className="[zoom:0.84]">© 2026 TechForge All right reserved</p>
      <p className="[zoom:0.84]">powered by TechForge Innovations</p>
    </footer>
  );
}


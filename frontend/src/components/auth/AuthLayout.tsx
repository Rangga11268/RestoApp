import { ForkKnife, QrCode, ShoppingCart, ChartBar } from '@phosphor-icons/react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    { icon: QrCode, text: "Menu digital via QR Code untuk pelanggan" },
    { icon: ShoppingCart, text: "Kelola pesanan dapur secara real-time" },
    { icon: ChartBar, text: "Laporan penjualan otomatis & akurat" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[44%] bg-primary flex-col justify-between p-12 relative overflow-hidden select-none">
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
              <ForkKnife size={20} weight="bold" className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              RestoApp
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Kelola restoran
            <br />
            lebih cerdas.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Platform manajemen restoran all-in-one. Dari menu digital hingga
            laporan penjualan, semua dalam satu dashboard.
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-3.5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <li key={f.text} className="flex items-center gap-3">
                  <Icon size={18} weight="bold" className="text-white/80 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{f.text}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          &copy; 2025 RestoApp. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}

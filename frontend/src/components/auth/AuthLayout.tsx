export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    { icon: "📱", text: "Menu digital via QR Code untuk pelanggan" },
    { icon: "🚀", text: "Kelola pesanan dapur secara real-time" },
    { icon: "📊", text: "Laporan penjualan otomatis & akurat" },
    { icon: "⚡", text: "Trial 14 hari gratis, tanpa kartu kredit" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[44%] bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/10 rounded-full" />
        <div className="absolute top-1/2 right-8 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl shadow-inner">
              🍽
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
          <p className="text-orange-100 text-sm leading-relaxed max-w-xs">
            Platform manajemen restoran all-in-one. Dari menu digital hingga
            laporan penjualan, semua dalam satu dashboard.
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-3.5">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="text-base w-6 text-center flex-shrink-0">
                  {f.icon}
                </span>
                <span className="text-orange-50 text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-orange-200/50 text-xs">
          © 2025 RestoApp. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}

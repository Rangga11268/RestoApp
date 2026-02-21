import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicMenu, type PublicCategory } from "@/services/menuService";
import { ImageOff, Clock } from "lucide-react";

interface Restaurant {
  name: string;
  address?: string;
  logo_url?: string | null;
  currency?: string;
}
interface TableInfo {
  id: number;
  name: string;
  capacity: number;
}

const formatCurrency = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

export default function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const tableId = params.get("table");

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPublicMenu(slug, tableId ?? undefined)
      .then((data) => {
        setRestaurant(data.restaurant);
        setTable(data.table ?? null);
        const cats: PublicCategory[] = data.categories ?? [];
        setCategories(cats);
        if (cats.length > 0) setActiveTab(cats[0].id);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug, tableId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-5xl mb-4">🍽</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Menu tidak ditemukan
        </h2>
        <p className="text-sm text-gray-400">
          Restoran belum tersedia atau URL tidak valid.
        </p>
      </div>
    );

  const activeItems =
    categories.find((c) => c.id === activeTab)?.active_menu_items ?? [];
  const allCats = categories.filter(
    (c) => c.active_menu_items && c.active_menu_items.length > 0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {restaurant?.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt="logo"
              className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              🍽
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">
              {restaurant?.name}
            </p>
            {restaurant?.address && (
              <p className="text-xs text-gray-400 truncate">
                {restaurant.address}
              </p>
            )}
          </div>
        </div>

        {/* Table banner */}
        {table && (
          <div className="bg-orange-500 text-white text-center text-sm py-1.5 px-4 font-medium">
            🪑 {table.name} — {table.capacity} kursi
          </div>
        )}

        {/* Category tabs */}
        {allCats.length > 0 && (
          <div className="max-w-lg mx-auto">
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
              {allCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    activeTab === c.id
                      ? "bg-orange-500 text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Menu belum tersedia saat ini.</p>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Tidak ada menu di kategori ini.
          </div>
        ) : (
          activeItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden flex gap-3 shadow-sm"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-24 h-24 flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-300">
                  <ImageOff size={22} />
                </div>
              )}
              <div className="flex flex-col justify-center py-3 pr-3 flex-1 min-w-0">
                <div className="flex items-start gap-1">
                  <p className="font-semibold text-gray-900 text-sm leading-snug flex-1 min-w-0">
                    {item.name}
                  </p>
                  {item.is_featured && (
                    <span className="text-amber-500 text-xs">⭐</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-orange-600 text-sm">
                    {formatCurrency(item.price, restaurant?.currency)}
                  </p>
                  {item.preparation_time ? (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={10} /> {item.preparation_time} mnt
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-xs text-gray-300">Powered by RestoApp</p>
      </div>
    </div>
  );
}

import React from 'react';
import { ForkKnife, Clock, Minus, Plus } from "@phosphor-icons/react";
import Button from '@/components/ui/Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fmt = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

interface MenuCardProps {
  item: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    image_url?: string | null;
    is_featured?: boolean;
    preparation_time?: number | null;
  };
  qty: number;
  currency?: string;
  onUpdateQty: (id: number, qty: number) => void;
}

export default function MenuCard({
  item,
  qty,
  currency,
  onUpdateQty,
}: MenuCardProps) {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group flex flex-col hover:-translate-y-2 relative ring-1 ring-slate-100 hover:ring-primary/20">
      <div className="relative overflow-hidden aspect-[4/3] p-2">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-[24px] group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200 rounded-[24px]">
            <ForkKnife size={48} weight="duotone" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {item.is_featured && (
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black px-3.5 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5 border border-white">
            <span className="animate-pulse text-amber-500">★</span> Chef's Choice
          </span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col relative z-10 bg-white">
        <h3 className="font-extrabold text-slate-900 text-lg leading-snug line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs font-medium text-slate-400 mt-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        
        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="font-black text-primary text-2xl tracking-tighter leading-none">
              {fmt(item.price, currency)}
            </p>
            {item.preparation_time && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg mt-3 border border-slate-100 tracking-wider">
                <Clock size={12} weight="bold" /> ±{item.preparation_time} min
              </span>
            )}
          </div>
          
          <div className="flex-shrink-0">
             {qty === 0 ? (
                <Button
                  onClick={() => onUpdateQty(item.id, 1)}
                  variant="primary"
                  className="px-6 py-2.5 font-bold tracking-tight rounded-xl shadow-lg shadow-primary/20"
                >
                  Add
                </Button>
              ) : (
                <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
                  <button
                    onClick={() => onUpdateQty(item.id, qty - 1)}
                    className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-primary transition-all p-0 border border-slate-100 active:scale-90"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <span className="text-sm font-black text-slate-900 w-4 text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, qty + 1)}
                    className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary-hover transition-all p-0 shadow-lg shadow-primary/30 active:scale-90"
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

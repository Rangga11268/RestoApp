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
    <div className="bg-surface rounded-lg overflow-hidden group flex flex-col relative ring-1 ring-rule hover:ring-accent/20">
      <div className="relative overflow-hidden aspect-[4/3] p-2">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg "
          />
        ) : (
          <div className="w-full h-full bg-paper-2 flex items-center justify-center text-ink-2 rounded-lg">
            <ForkKnife size={48} weight="bold" />
          </div>
        )}

        {item.is_featured && (
          <span className="absolute top-4 left-4 bg-white text-amber-950 text-[9px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-amber-200">
            Chef's Choice
          </span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col relative z-10 bg-surface">
        <h3 className="font-semibold text-ink text-lg leading-snug line-clamp-2 tracking-tight group-hover:text-accent transition-colors">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs font-medium text-ink-2 mt-3 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        
        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="font-semibold text-accent text-2xl tracking-tighter leading-none">
              {fmt(item.price, currency)}
            </p>
            {item.preparation_time && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-ink-2 bg-paper-2 px-2.5 py-1 rounded-lg mt-3 border border-rule-light tracking-wider">
                <Clock size={12} weight="bold" /> ±{item.preparation_time} min
              </span>
            )}
          </div>
          
          <div className="flex-shrink-0">
             {qty === 0 ? (
                <Button
                  onClick={() => onUpdateQty(item.id, 1)}
                  variant="primary"
                  className="px-6 py-2.5 font-bold tracking-tight rounded-xl"
                >
                  Add
                </Button>
              ) : (
                <div className="flex items-center gap-4 bg-paper-2 rounded-2xl p-1.5 border border-rule-light shadow-inner">
                  <button
                    onClick={() => onUpdateQty(item.id, qty - 1)}
                    className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-ink hover:text-accent p-0 border border-rule-light"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <span className="text-sm font-semibold text-ink w-4 text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, qty + 1)}
                    className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white hover:bg-accent-hover p-0"
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

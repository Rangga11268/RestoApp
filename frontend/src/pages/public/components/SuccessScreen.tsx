import React from 'react';
import { CheckCircle } from "@phosphor-icons/react";
import Button from '@/components/ui/Button';

interface SuccessScreenProps {
  orderNumber: string;
  onReset: () => void;
}

export default function SuccessScreen({
  orderNumber,
  onReset,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden font-sans selection:bg-primary/20">
       {/* Decorative Gradient Background */}
       <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-success/5 to-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-primary/5 to-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-2xl md:rounded-[48px] min-h-screen md:min-h-[700px] shadow-premium flex flex-col items-center justify-center px-10 py-16 text-center relative z-10 border border-white/50 animate-in">
        
        <div className="relative mb-10">
           <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
           <div className="w-32 h-32 bg-gradient-to-tr from-success to-emerald-400 rounded-full flex items-center justify-center shadow-2xl shadow-success/30 relative z-10">
             <CheckCircle size={64} weight="fill" className="text-white" />
           </div>
        </div>

        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tighter">
          Order Received!
        </h2>
        <p className="text-base font-medium text-slate-400 mb-12 max-w-[320px] leading-relaxed">
          Our kitchen is already preparing your delicious meal. Please make yourself comfortable!
        </p>

        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-10 w-full mb-12 shadow-inner relative overflow-hidden group">
          {/* Ticket styling elements */}
          <div className="absolute top-1/2 -left-5 w-10 h-10 bg-white rounded-full -translate-y-1/2 shadow-inner border border-slate-200" />
          <div className="absolute top-1/2 -right-5 w-10 h-10 bg-white rounded-full -translate-y-1/2 shadow-inner border border-slate-200" />

          <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black mb-3">
            Your Order Number
          </p>
          <div className="text-5xl font-black text-slate-900 tracking-[0.2em] transform transition-transform group-hover:scale-110">
            {orderNumber}
          </div>
        </div>

        <Button 
            onClick={onReset} 
            variant="primary" 
            size="lg"
            className="w-full font-bold shadow-2xl shadow-primary/20 animate-in delay-300"
        >
          Back to Menu
        </Button>
      </div>
    </div>
  );
}

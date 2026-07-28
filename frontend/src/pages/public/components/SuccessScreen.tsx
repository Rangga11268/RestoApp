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
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper-2 relative overflow-hidden font-sans selection:bg-accent/20">
       {/* Decorative Gradient Background */}
       <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-success/5 to-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-gradient-to-br from-accent/5 to-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-surface md:rounded-lg min-h-screen md:min-h-[700px] flex flex-col items-center justify-center px-10 py-16 text-center relative z-10 border border-gray-200">
        
        <div className="relative mb-10">
           <div className="w-32 h-32 bg-gradient-to-tr from-success to-emerald-400 rounded-full flex items-center justify-center relative z-10">
             <CheckCircle size={64} weight="bold" className="text-white" />
           </div>
        </div>

        <h2 className="text-4xl font-semibold text-ink mb-4 tracking-tighter">
          Order Received!
        </h2>
        <p className="text-base font-medium text-ink-2 mb-12 max-w-[320px] leading-relaxed">
          Our kitchen is already preparing your delicious meal. Please make yourself comfortable!
        </p>

        <div className="bg-paper-2 border-2 border-dashed border-rule rounded-lg p-10 w-full mb-12 shadow-inner relative overflow-hidden group">
          {/* Ticket styling elements */}
          <div className="absolute top-1/2 -left-5 w-10 h-10 bg-surface rounded-full -translate-y-1/2 shadow-inner border border-rule" />
          <div className="absolute top-1/2 -right-5 w-10 h-10 bg-surface rounded-full -translate-y-1/2 shadow-inner border border-rule" />

          <p className="text-[10px] text-ink-2 uppercase tracking-wider font-semibold mb-3">
            Your Order Number
          </p>
          <div className="text-5xl font-semibold text-ink tracking-[0.2em]">
            {orderNumber}
          </div>
        </div>

        <Button 
            onClick={onReset} 
            variant="primary" 
            size="lg"
            className="w-full font-bold"
        >
          Back to Menu
        </Button>
      </div>
    </div>
  );
}

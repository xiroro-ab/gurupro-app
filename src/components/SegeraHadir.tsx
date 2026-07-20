import React from 'react';
import { Construction } from 'lucide-react';

export default function SegeraHadir({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs h-[60vh] text-center">
      <div className="h-24 w-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Construction className="h-12 w-12" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">{title}</h2>
      <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="mt-8 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-semibold border border-slate-200">
        Dalam Tahap Pengembangan
      </div>
    </div>
  );
}

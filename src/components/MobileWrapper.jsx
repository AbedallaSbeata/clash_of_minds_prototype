import React from 'react';

const MobileWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* The "Phone" Container */}
      <div 
        className="relative bg-[#0d0b1f] shadow-[2xl] overflow-hidden flex flex-col mx-auto"
        style={{
          height: 'min(95vh, 900px)', // الارتفاع يتناسب مع شاشتك
          aspectRatio: '9 / 16',     // النسبة الدقيقة لـ 1080x1920
          borderRadius: '2.5rem',
          border: '10px solid #1a1635',
          boxShadow: '0 0 60px rgba(0,0,0,0.9)'
        }}
      >
        {/* Status Bar Notch (Optional for WOW factor) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-[100]" />
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileWrapper;

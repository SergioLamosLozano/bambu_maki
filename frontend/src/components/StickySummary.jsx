import React from 'react';

export default function StickySummary({ 
  baseName, 
  basePrice, 
  extras = [], 
  totalPrice, 
  onBack, 
  onNext, 
  nextLabel = "SIGUIENTE PASO →",
  isNextDisabled = false 
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-5 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t-4 border-yellow-400 z-50">
      
      {/* Product Summary */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-black text-lg text-gray-900 uppercase tracking-wide">{baseName}</h2>
        <span className="text-xl">🍣</span>
      </div>

      <div className="flex justify-between items-center text-red-600 font-bold mb-2">
        <span className="text-xs uppercase tracking-wide">BASE: {baseName}</span>
        <span className="text-sm">${basePrice.toLocaleString()}</span>
      </div>

      {/* Extras List */}
      <div className="space-y-1 mb-2 max-h-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {extras.map((extra, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>
              {extra.name} {extra.qty > 1 ? `(x${extra.qty})` : ''}
            </span>
            {extra.price > 0 && (
              <span className="text-green-600">
                +${(extra.price * (extra.qty || 1)).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 my-3"></div>

      {/* Total and Action Buttons (Combined to save space) */}
      <div className="flex items-center justify-between gap-3 mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Total</span>
          <span className="text-2xl font-black text-red-600 leading-none">${totalPrice.toLocaleString()}</span>
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          <button 
            onClick={onBack}
            className="px-4 bg-white text-gray-600 font-extrabold uppercase rounded-xl py-3 border-2 border-gray-200 hover:bg-gray-50 transition-colors text-xs"
          >
            Atrás
          </button>
          <button 
            onClick={onNext}
            disabled={isNextDisabled}
            className={`flex-1 text-white font-extrabold uppercase rounded-xl py-3 transition-colors text-xs px-2 ${
              isNextDisabled ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

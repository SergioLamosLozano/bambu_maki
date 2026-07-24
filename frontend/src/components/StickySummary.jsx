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
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t-4 border-yellow-400 z-50">
      
      {/* Product Summary */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-black text-xl text-gray-900 uppercase tracking-wide">{baseName}</h2>
        <span className="text-2xl">🍣</span>
      </div>

      <div className="flex justify-between items-center text-red-600 font-bold mb-3">
        <span className="text-sm uppercase tracking-wide">BASE: {baseName}</span>
        <span>${basePrice.toLocaleString()}</span>
      </div>

      {/* Extras List */}
      <div className="space-y-2 mb-4">
        {extras.map((extra, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase">
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

      <div className="border-t border-dashed border-gray-300 my-4"></div>

      {/* Total */}
      <div className="flex justify-between items-end mb-6">
        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Actual</span>
        <span className="text-4xl font-black text-red-600">${totalPrice.toLocaleString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={onBack}
          className="w-1/3 bg-white text-gray-600 font-extrabold uppercase rounded-2xl py-4 border-2 border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button 
          onClick={onNext}
          disabled={isNextDisabled}
          className={`w-2/3 text-white font-extrabold uppercase rounded-2xl py-4 transition-colors ${
            isNextDisabled ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

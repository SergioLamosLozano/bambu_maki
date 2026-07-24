import React from 'react';
import { Check } from 'lucide-react';

export default function OptionCard({ 
  title, 
  subtitle, 
  price, 
  image, 
  isSelected, 
  onClick, 
  quantity, 
  onIncrease, 
  onDecrease 
}) {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-3xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
        isSelected ? 'border-green-500' : 'border-transparent'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1 border-2 border-white z-10">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {image && (
          <div className="w-24 h-24 mb-3 flex items-center justify-center">
             {/* Replace with actual <img> tag when images are available */}
            <span className="text-4xl">{image}</span>
          </div>
        )}
        
        <h3 className="font-extrabold text-lg text-gray-800 leading-tight mb-1">{title}</h3>
        
        {subtitle && (
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{subtitle}</p>
        )}

        {price && (
          <div className="mt-2 text-sm font-bold text-gray-700">
            {price === 0 ? 'GRATIS' : `+$${price.toLocaleString()}`}
          </div>
        )}

        {/* Quantity Controls (e.g. for drinks) */}
        {quantity !== undefined && (
          <div className="flex items-center gap-3 mt-3 w-full justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); onDecrease(); }}
              className="w-8 h-8 rounded border border-red-300 text-red-500 font-bold text-xl flex items-center justify-center hover:bg-red-50"
            >
              -
            </button>
            <span className="font-bold w-4 text-center">{quantity}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onIncrease(); }}
              className="w-8 h-8 rounded border border-green-500 text-green-600 font-bold text-xl flex items-center justify-center hover:bg-green-50"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

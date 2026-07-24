import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StepWizard({ currentStep, totalSteps }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-full shadow-sm mb-6 max-w-full overflow-x-auto mx-auto justify-center">
      {/* Home button */}
      <button 
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
      >
        <Home size={18} className="text-red-500" />
      </button>

      {/* Steps */}
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isPast = stepNumber < currentStep;

        return (
          <div 
            key={stepNumber}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 transition-colors ${
              isActive ? 'bg-green-500 text-white' : 
              isPast ? 'bg-red-600 text-white' : 
              'bg-gray-100 text-gray-400'
            }`}
          >
            {stepNumber}
          </div>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import StepWizard from '../../components/StepWizard';
import OptionCard from '../../components/OptionCard';
import StickySummary from '../../components/StickySummary';
import useCartStore from '../../store/cartStore';

export default function ProductBuilder() {
  const { type } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  
  const item = location.state?.item;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for selections: { category_id: { option_id: qty } }
  const [selections, setSelections] = useState({});
  const [availableRolls, setAvailableRolls] = useState([]);
  const [selectedRolls, setSelectedRolls] = useState([]);

  useEffect(() => {
    if (item) {
      axios.get('http://127.0.0.1:8000/api/options/categories')
        .then(res => {
          // Filter categories: must be active AND (global or matches this product type)
          const activeCategories = res.data.filter(c => 
            c.is_active && (!c.product_type_id || c.product_type_id === item.product_type_id)
          );
          setCategories(activeCategories);
          
          // Initialize selections
          const initialSelections = {};
          activeCategories.forEach(cat => {
            initialSelections[cat.id] = {};
          });
          setSelections(initialSelections);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
        
      if (item.includes_rolls > 0) {
        axios.get('http://127.0.0.1:8000/api/products/')
          .then(res => {
            const rollsType = res.data.find(type => type.name.toLowerCase().includes('rollo'));
            if (rollsType) {
              setAvailableRolls(rollsType.variations);
            }
          })
          .catch(err => console.error("Error fetching rolls for combo", err));
      }
    }
  }, [item]);

  if (!item) {
    return <div className="p-8 text-center">Producto no encontrado</div>;
  }

  if (loading) {
    return <div className="p-8 text-center font-bold text-gray-500">Cargando opciones...</div>;
  }

  const hasRollsSelection = item.includes_rolls > 0;
  const totalSteps = categories.length + (hasRollsSelection ? 1 : 0) + 1; // Categories + Rolls Step + Confirmation

  const handleToggleOption = (categoryId, option, allowQuantity, delta = 0) => {
    setSelections(prev => {
      const currentCatSelections = prev[categoryId] || {};
      const newCatSelections = { ...currentCatSelections };
      
      if (allowQuantity) {
        const currentQty = newCatSelections[option.id] || 0;
        const newQty = Math.max(0, currentQty + delta);
        if (newQty === 0) delete newCatSelections[option.id];
        else newCatSelections[option.id] = newQty;
      } else {
        const isSelected = !!newCatSelections[option.id];
        if (isSelected) delete newCatSelections[option.id];
        else newCatSelections[option.id] = 1;
      }
      
      return { ...prev, [categoryId]: newCatSelections };
    });
  };

  const getSelectedExtrasArray = () => {
    const list = [];
    categories.forEach(cat => {
      const catSelections = selections[cat.id] || {};
      Object.entries(catSelections).forEach(([optId, qty]) => {
        const opt = cat.options.find(o => o.id === optId);
        if (opt) {
          list.push({ ...opt, qty, price: opt.extra_price });
        }
      });
    });
    return list;
  };

  const selectedExtrasList = getSelectedExtrasArray();
  const extrasTotal = selectedExtrasList.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const totalPrice = item.base_price + extrasTotal;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Validate roll selection step if we are on it
      if (hasRollsSelection && currentStep === 1) {
        if (selectedRolls.length !== item.includes_rolls) {
          alert(`Debes elegir exactamente ${item.includes_rolls} rollos para este combo.`);
          return;
        }
      }
      
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0, 0);
    } else {
      let notes = "";
      if (hasRollsSelection && selectedRolls.length > 0) {
        // Build notes from selected rolls
        const rollCounts = selectedRolls.reduce((acc, rollId) => {
          const roll = availableRolls.find(r => r.id === rollId);
          if (roll) {
            acc[roll.name] = (acc[roll.name] || 0) + 1;
          }
          return acc;
        }, {});
        
        const rollsText = Object.entries(rollCounts).map(([name, count]) => count > 1 ? `${name} x${count}` : name).join(', ');
        notes = `Rollos elegidos: ${rollsText}`;
      }

      addItem({
        ...item,
        cartId: `${item.id}-${Date.now()}`,
        finalPrice: totalPrice,
        selections: selectedExtrasList,
        notes: notes || undefined
      });
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1);
      window.scrollTo(0, 0);
    } else {
      navigate(-1);
    }
  };

  const handleToggleRoll = (rollId, delta) => {
    setSelectedRolls(prev => {
      if (delta > 0) {
        if (prev.length >= item.includes_rolls) return prev; // Limit reached
        return [...prev, rollId];
      } else {
        const index = prev.lastIndexOf(rollId);
        if (index > -1) {
          const newArray = [...prev];
          newArray.splice(index, 1);
          return newArray;
        }
        return prev;
      }
    });
  };

  const renderStepContent = () => {
    if (currentStep === totalSteps) {
      return (
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">✅</span>
          <h2 className="text-3xl font-black uppercase mb-2">¡Todo Listo!</h2>
          <p className="text-gray-500 font-bold mb-4">Verifica tu resumen en la parte inferior y agrega al carrito.</p>
          {hasRollsSelection && (
            <div className="bg-yellow-50 p-4 rounded-xl inline-block max-w-sm mx-auto border-2 border-yellow-200">
              <p className="font-bold text-yellow-800 text-sm">Rollos Seleccionados:</p>
              <ul className="text-left text-sm mt-2 text-yellow-700">
                {Array.from(new Set(selectedRolls)).map(rollId => {
                  const count = selectedRolls.filter(id => id === rollId).length;
                  const roll = availableRolls.find(r => r.id === rollId);
                  return <li key={rollId}>- {roll?.name} {count > 1 ? `(x${count})` : ''}</li>
                })}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (hasRollsSelection && currentStep === 1) {
      return (
        <div>
          <h2 className="text-2xl font-black uppercase mb-2">Elige tus {item.includes_rolls} Rollos</h2>
          <p className="text-gray-500 font-bold mb-6">Llevas {selectedRolls.length} de {item.includes_rolls} elegidos.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableRolls.map(roll => {
              const quantity = selectedRolls.filter(id => id === roll.id).length;
              return (
                <OptionCard 
                  key={roll.id}
                  title={roll.name}
                  price={0}
                  image="🍣"
                  isSelected={quantity > 0}
                  quantity={quantity}
                  onIncrease={() => handleToggleRoll(roll.id, 1)}
                  onDecrease={() => handleToggleRoll(roll.id, -1)}
                  onClick={() => {
                    if (quantity === 0) handleToggleRoll(roll.id, 1);
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // Adjust index based on whether we have the rolls step
    const categoryIndex = hasRollsSelection ? currentStep - 2 : currentStep - 1;
    const category = categories[categoryIndex];
    if (!category) return null;

    return (
      <div>
        <h2 className="text-2xl font-black uppercase mb-4">{category.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {category.options.map(option => (
            <OptionCard 
              key={option.id}
              title={option.name}
              price={option.extra_price}
              image={option.emoji}
              isSelected={!!(selections[category.id] && selections[category.id][option.id])}
              quantity={category.allow_quantity ? (selections[category.id]?.[option.id] || 0) : undefined}
              onIncrease={category.allow_quantity ? () => handleToggleOption(category.id, option, true, 1) : undefined}
              onDecrease={category.allow_quantity ? () => handleToggleOption(category.id, option, true, -1) : undefined}
              onClick={() => {
                if (category.allow_quantity) {
                  if (!selections[category.id]?.[option.id]) handleToggleOption(category.id, option, true, 1);
                } else {
                  handleToggleOption(category.id, option, false);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-64 pt-4 px-4 max-w-7xl mx-auto w-full">
      <StepWizard currentStep={currentStep} totalSteps={totalSteps} />
      
      <div className="mb-8">
        {renderStepContent()}
      </div>

      <StickySummary 
        baseName={item.name}
        basePrice={item.base_price}
        extras={selectedExtrasList}
        totalPrice={totalPrice}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={currentStep === totalSteps ? '✔ LISTO, AGREGAR' : 'SIGUIENTE PASO →'}
      />
    </div>
  );
}

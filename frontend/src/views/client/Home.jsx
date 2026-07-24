import { API_URL, API_BASE } from '../../config'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({ rollos: [], combos: [], rolloDelDia: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, todayRollRes] = await Promise.all([
          axios.get(`${API_URL}/products/`),
          axios.get(`${API_URL}/products/daily_roll/today`).catch(() => ({ data: null }))
        ]);

        const data = productsRes.data;
        const dailyRollData = todayRollRes.data;

        let rollos = [];
        let combos = [];
        let rolloDelDia = null;

        if (dailyRollData && dailyRollData.variation) {
          rolloDelDia = {
            ...dailyRollData.variation,
            originalPrice: dailyRollData.variation.base_price,
            base_price: parseInt(dailyRollData.discount_price) || dailyRollData.variation.base_price
          };
        }

        data.forEach(type => {
          if (type.slug === 'rollo') {
            rollos = type.variations;
            if (rolloDelDia) {
              rollos = rollos.filter(v => v.id !== rolloDelDia.id);
            }
          } else if (type.slug === 'combo') {
            combos = type.variations;
          }
        });

        setProducts({ rollos, combos, rolloDelDia });
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleBuildCombo = (item, type) => {
    navigate(`/build/${type}/${item.id}`, { state: { item } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-4xl mb-4">🍣</div>
        <p className="font-bold uppercase tracking-widest text-sm" style={{ color: '#ECDA35' }}>Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header saludo */}
      <div className="text-center mb-10 pt-4">
        <h1 className="text-4xl font-black uppercase mb-2" style={{ color: '#ECDA35' }}>
          ¿Qué querés hoy?
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#C99B62' }}>
          Seleccioná tu producto preferido
        </p>
      </div>

      {/* Rollo del Día */}
      {products.rolloDelDia && (
        <div className="mb-10">
          <h2 className="text-lg font-black uppercase mb-4 px-1 flex items-center gap-2" style={{ color: '#ECDA35' }}>
            <span>⭐️</span> Rollo del Día
          </h2>
          <div
            onClick={() => handleBuildCombo(products.rolloDelDia, 'rollo')}
            className="rounded-[2rem] p-6 cursor-pointer transition-all flex flex-col items-center text-center overflow-hidden hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, #1a3310 0%, #2a4a1a 100%)',
              border: '3px solid #ECDA35',
              boxShadow: '0 8px 32px rgba(236,218,53,0.15)'
            }}
          >
            {products.rolloDelDia.image_url ? (
              <img src={`${API_BASE}${products.rolloDelDia.image_url}`} alt={products.rolloDelDia.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            ) : (
              <span className="text-6xl mb-4">🍱</span>
            )}
            <h3 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{products.rolloDelDia.name}</h3>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#C99B62' }}>
              {products.rolloDelDia.description}
            </p>
            <div className="flex gap-3 items-end">
              <span className="font-bold line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ${products.rolloDelDia.originalPrice?.toLocaleString()}
              </span>
              <span className="text-2xl font-black" style={{ color: '#ECDA35' }}>
                ${products.rolloDelDia.base_price.toLocaleString()}
              </span>
            </div>
            <span className="mt-3 px-4 py-1 rounded-full text-xs font-black uppercase" style={{ background: '#FC2803', color: '#fff' }}>
              ¡Oferta del día!
            </span>
          </div>
        </div>
      )}

      {/* Combos */}
      {products.combos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black uppercase mb-4 px-1 flex items-center gap-2" style={{ color: '#ECDA35' }}>
            <span>🍱</span> Combos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.combos.map(combo => (
              <div
                key={combo.id}
                onClick={() => handleBuildCombo(combo, 'combo')}
                className="rounded-[2rem] p-6 cursor-pointer transition-all flex flex-col items-center text-center hover:scale-[1.02]"
                style={{
                  background: '#1c2e0f',
                  border: '2px solid #75A721',
                  boxShadow: '0 4px 16px rgba(117,167,33,0.1)'
                }}
              >
                {combo.image_url ? (
                  <img src={`${API_BASE}${combo.image_url}`} alt={combo.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                ) : (
                  <span className="text-6xl mb-4">🍱</span>
                )}
                <h3 className="text-xl font-black mb-1" style={{ color: '#fff' }}>{combo.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#C99B62' }}>
                  {combo.description}
                </p>
                <span className="text-xl font-black" style={{ color: '#ECDA35' }}>
                  ${combo.base_price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rollos Individuales */}
      {products.rollos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black uppercase mb-4 px-1 flex items-center gap-2" style={{ color: '#ECDA35' }}>
            <span>🍣</span> Rollos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.rollos.map(rollo => (
              <div
                key={rollo.id}
                onClick={() => handleBuildCombo(rollo, 'rollo')}
                className="rounded-[2rem] p-6 cursor-pointer transition-all flex flex-col items-center text-center hover:scale-[1.02]"
                style={{
                  background: '#1c2e0f',
                  border: '2px solid rgba(201,155,98,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                {rollo.image_url ? (
                  <img src={`${API_BASE}${rollo.image_url}`} alt={rollo.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                ) : (
                  <span className="text-6xl mb-4">🍣</span>
                )}
                <h3 className="text-xl font-black mb-1" style={{ color: '#fff' }}>{rollo.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#C99B62' }}>
                  {rollo.description}
                </p>
                <span className="text-xl font-black" style={{ color: '#FC2803' }}>
                  ${rollo.base_price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

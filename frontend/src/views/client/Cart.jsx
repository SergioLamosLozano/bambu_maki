import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useCartStore from '../../store/cartStore'

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, duplicateItemBase, getTotal, clearCart } = useCartStore()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    tipoEntrega: 'DOMICILIO',
    direccion: '',
    observaciones: ''
  })
  const [deliveryCost, setDeliveryCost] = useState(3000)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/settings/delivery_cost')
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setDeliveryCost(parseInt(data.value))
        }
      })
      .catch(err => console.error("Error fetching delivery cost:", err))
  }, [])

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-black uppercase mb-4" style={{ color: '#ECDA35' }}>Tu carrito está vacío</h2>
        <p className="font-bold mb-8" style={{ color: '#C99B62' }}>¡Agregá unos deliciosos makis para empezar!</p>
        <Link
          to="/"
          className="font-black uppercase py-4 px-8 rounded-2xl transition-colors"
          style={{ background: '#FC2803', color: '#fff' }}
        >
          Volver al Menú
        </Link>
      </div>
    )
  }

  const subtotal = getTotal()
  const costoEnvio = deliveryCost
  const totalFinal = subtotal + costoEnvio

  const handleConfirmOrder = async () => {
    try {
      const items = cartItems.map(item => {
        const selected_options = [];
        if (item.selections) {
          item.selections.forEach(opt => {
            const qty = opt.qty || 1;
            for (let i = 0; i < qty; i++) {
              selected_options.push({ option_id: opt.id });
            }
          });
        }
        return {
          product_variation_id: item.id,
          quantity: item.quantity,
          subtotal: item.finalPrice * item.quantity,
          notes: item.notes,
          selected_options
        };
      });

      const payload = {
        customer_name: formData.nombre,
        customer_phone: formData.telefono,
        customer_address: formData.direccion,
        delivery_type: formData.tipoEntrega.toLowerCase(),
        delivery_cost: costoEnvio,
        total_price: totalFinal,
        items
      };

      const response = await fetch('http://127.0.0.1:8000/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Error al enviar el pedido");
      }

      clearCart();
      toast.success(
        '¡Pedido enviado con éxito! Recibirás una confirmación o cancelación vía WhatsApp al número que ingresaste.',
        { duration: 6000 }
      );
      navigate('/');
    } catch (error) {
      console.error("Error confirmando pedido:", error);
      toast.error("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
    }
  }

  const isFormValid = formData.nombre && formData.telefono && formData.direccion;

  return (
    <div className="pb-40 px-4 pt-4 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumen del carrito */}
        <div
          className="rounded-3xl p-6 h-fit"
          style={{ background: '#1c2e0f', border: '2px solid #75A721' }}
        >
          <h2
            className="text-2xl font-black uppercase mb-6 pb-4"
            style={{ color: '#ECDA35', borderBottom: '2px dashed rgba(117,167,33,0.4)' }}
          >
            Resumen de tu pedido
          </h2>

          <div className="space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.cartId}
                className="flex flex-col pb-6 last:pb-0"
                style={{ borderBottom: '2px dashed rgba(117,167,33,0.2)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg" style={{ color: '#fff' }}>{item.name}</h3>
                </div>

                {item.notes && (
                  <p
                    className="text-sm font-bold mb-2 pl-4 italic p-2 rounded-lg"
                    style={{ background: 'rgba(236,218,53,0.1)', color: '#ECDA35', border: '1px solid rgba(236,218,53,0.2)' }}
                  >
                    {item.notes}
                  </p>
                )}

                {item.selections && item.selections.length > 0 && (
                  <ul className="text-sm font-bold mb-3 pl-4 list-disc" style={{ color: '#C99B62' }}>
                    {item.selections.map(opt => (
                      <li key={opt.id}>
                        {opt.name} {opt.qty > 1 ? `x${opt.qty}` : ''}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-between items-center mt-auto flex-wrap gap-2">
                  <span className="font-black text-lg" style={{ color: '#75A721' }}>
                    ${item.finalPrice.toLocaleString()}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateItemBase(item)}
                      className="px-3 py-1 font-bold text-xs uppercase rounded-lg transition-colors"
                      style={{ background: 'rgba(117,167,33,0.15)', color: '#75A721', border: '1px solid #75A721' }}
                      title="Repetir rollo base"
                    >
                      ➕ Base
                    </button>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="px-3 py-1 font-bold text-xs uppercase rounded-lg transition-colors"
                      style={{ background: 'rgba(252,40,3,0.1)', color: '#FC2803', border: '1px solid rgba(252,40,3,0.3)' }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario datos de entrega */}
        <div
          className="rounded-[2rem] p-6 h-fit"
          style={{ background: '#1c2e0f', border: '3px solid #ECDA35' }}
        >
          <h2 className="text-xl font-black uppercase mb-6" style={{ color: '#ECDA35' }}>Datos de Entrega</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C99B62' }}>¿Cómo te llamás?</label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full rounded-2xl px-4 py-3 font-bold outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(201,155,98,0.3)',
                  color: '#fff'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C99B62' }}>Teléfono de contacto</label>
              <input
                type="tel"
                placeholder="Ej: 300 123 4567"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full rounded-2xl px-4 py-3 font-bold outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(201,155,98,0.3)',
                  color: '#fff'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#C99B62' }}>¿Cómo lo querés?</label>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-3 rounded-2xl font-black text-sm uppercase"
                  style={{ background: '#75A721', color: '#fff', boxShadow: '0 4px 16px rgba(117,167,33,0.3)' }}
                >
                  🛵 Envío a Domicilio
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 flex gap-3"
              style={{ background: 'rgba(236,218,53,0.08)', border: '2px solid rgba(236,218,53,0.25)' }}
            >
              <span className="text-xl">🛵</span>
              <p className="text-xs font-bold leading-relaxed" style={{ color: '#ECDA35' }}>
                El servicio a domicilio tiene un recargo fijo de{' '}
                <span className="font-black">${deliveryCost.toLocaleString()}</span>{' '}
                para asegurar que tu sushi llegue perfecto.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 mt-2" style={{ color: '#C99B62' }}>Dirección exacta</label>
              <input
                type="text"
                placeholder="Ej: Calle 123 #45-67 Barrio..."
                value={formData.direccion}
                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full rounded-2xl px-4 py-3 font-bold outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(117,167,33,0.4)',
                  color: '#fff'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 mt-2" style={{ color: '#C99B62' }}>¿Palillos, Soya extra, Sin aguacate?</label>
              <textarea
                placeholder="Escribe aquí cualquier recomendación para tu pedido..."
                value={formData.observaciones}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full rounded-2xl px-4 py-3 font-bold outline-none transition-all resize-none h-24"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px solid rgba(117,167,33,0.4)',
                  color: '#fff'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Checkout */}
      <div
        className="fixed bottom-0 left-0 right-0 p-6 pb-8 z-50"
        style={{
          background: '#112109',
          borderTop: '3px solid #ECDA35',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.4)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center font-bold mb-2 uppercase text-xs tracking-widest" style={{ color: '#C99B62' }}>
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>

          {costoEnvio > 0 && (
            <div className="flex justify-between items-center font-bold mb-4 uppercase text-xs tracking-widest" style={{ color: '#C99B62' }}>
              <span>Domicilio</span>
              <span>${costoEnvio.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-end mb-6">
            <span className="text-sm font-black uppercase" style={{ color: '#fff' }}>Total</span>
            <span className="text-4xl font-black" style={{ color: '#ECDA35' }}>${totalFinal.toLocaleString()}</span>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={!isFormValid}
            className="w-full py-5 rounded-2xl font-black uppercase text-lg transition-all"
            style={
              isFormValid
                ? {
                    background: '#FC2803',
                    color: '#fff',
                    boxShadow: '0 6px 24px rgba(252,40,3,0.45)',
                    transform: 'none'
                  }
                : {
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'not-allowed'
                  }
            }
          >
            🔥 Confirmar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}

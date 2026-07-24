import React, { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'

const ClientLayout = () => {
  const cartItems = useCartStore((state) => state.cartItems)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const total = cartItems.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0)

  return (
    <div className="min-h-screen flex flex-col relative pb-20" style={{ background: '#112109' }}>
      {/* Header con identidad de marca */}
      <header
        className="p-4 sticky top-0 z-40 flex justify-between items-center"
        style={{ background: '#112109', borderBottom: '3px solid #ECDA35' }}
      >
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/BAMBUlogo.png" alt="Bambu Maki Logo" className="h-20 w-auto object-contain" />
        </Link>

        {/* Cart button */}
        {itemCount > 0 && (
          <Link
            to="/cart"
            className="flex items-center gap-3 px-5 py-3 rounded-2xl font-black shadow-lg hover:-translate-y-0.5 transition-transform"
            style={{ background: '#FC2803', color: '#fff', boxShadow: '0 4px 20px rgba(252,40,3,0.4)' }}
          >
            <div className="relative">
              <span className="text-xl">🛒</span>
              <span
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px]"
                style={{ background: '#ECDA35', color: '#112109', border: '2px solid #FC2803' }}
              >
                {itemCount}
              </span>
            </div>
            <div className="flex flex-col border-l pl-3 leading-tight" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <span className="font-bold text-[10px] uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>Ver Pedido</span>
              <span className="font-black text-sm">${total.toLocaleString()}</span>
            </div>
          </Link>
        )}
      </header>

      <main className="flex-grow p-4 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}

export default ClientLayout

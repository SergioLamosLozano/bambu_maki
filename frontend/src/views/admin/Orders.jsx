import { API_URL } from '../../config'
import React, { useState, useEffect } from 'react'
import { RefreshCw, CloudOff, X } from 'lucide-react'

const Orders = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('NUEVOS / PENDIENTES')
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({
    today_orders: 0,
    pending_orders: 0,
    accepted_orders: 0,
    cancelled_orders: 0,
    today_revenue: 0
  })
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [now, setNow] = useState(new Date())
  const [whatsappTemplate, setWhatsappTemplate] = useState("¡Hola! Tu pedido en Bambu Maki ha sido ACEPTADO y ya lo estamos preparando.")

  const TABS = ['NUEVOS / PENDIENTES', 'CONFIRMADOS', 'HISTORIAL / CANCELADOS']

  const fetchOrdersAndStats = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/orders/`),
        fetch(`${API_URL}/orders/stats`)
      ])
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  useEffect(() => {
    fetchOrdersAndStats()
    // Cargar settings iniciales (sin bloquear)
    fetch(`${API_URL}/settings/whatsapp_template`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.value) setWhatsappTemplate(d.value) })
      .catch(() => {})
      
    fetch(`${API_URL}/settings/store_is_open`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIsStoreOpen(d.value === 'true') })
      .catch(() => {})

    const interval = setInterval(fetchOrdersAndStats, 10000)
    const clockInterval = setInterval(() => setNow(new Date()), 1000)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedOrder(null)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(interval)
      clearInterval(clockInterval)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  
  const toggleStoreStatus = async () => {
      const newStatus = !isStoreOpen;
      setIsStoreOpen(newStatus); // Optimistic UI update
      try {
          // You might need an auth token if Settings endpoint is protected, but assuming it works based on previous code.
          const token = localStorage.getItem('token');
          await fetch(`${API_URL}/settings/store_is_open`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ value: newStatus ? 'true' : 'false' })
          });
      } catch (err) {
          console.error("Error toggling store status", err);
          setIsStoreOpen(!newStatus); // Revert on failure
      }
  }

  // Construye el link de WhatsApp antes de cualquier await (evita popup blocker)
  const buildWhatsappUrl = (targetOrder, status) => {
    if (!targetOrder?.customer_phone) return null
    const phoneStr = targetOrder.customer_phone.replace(/\D/g, '')
    const finalPhone = phoneStr.startsWith('57') ? phoneStr : `57${phoneStr}`
    const orderRef = targetOrder.order_number ? `#${targetOrder.order_number}` : `#${targetOrder.id.split('-')[0].toUpperCase()}`

    let message = ''
    if (status === 'preparando') {
      message = `${whatsappTemplate}\n\nNo. Pedido: ${orderRef}\nTotal: $${targetOrder.total_price.toLocaleString()}\nTipo: ${targetOrder.delivery_type.toUpperCase()}`
    } else if (status === 'cancelado') {
      message = `Hola ${targetOrder.customer_name}, lamentablemente tu pedido ${orderRef} en Bambu Maki ha sido CANCELADO.\n\nSi tienes dudas, no dudes en contactarnos. Disculpa los inconvenientes.`
    }

    return message ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}` : null
  }

  // order es el objeto completo (para no depender del estado al momento del click)
  const updateOrderStatus = async (orderId, newStatus, order = null) => {
    const targetOrder = order || orders.find(o => o.id === orderId)

    // Construir URL ANTES del await — el browser solo acepta window.open sincrónico al click
    const whatsappUrl = (newStatus === 'preparando' || newStatus === 'cancelado')
      ? buildWhatsappUrl(targetOrder, newStatus)
      : null

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        // Abrir WhatsApp INMEDIATAMENTE después del ok, antes de cualquier otro await
        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank')
        }
        fetchOrdersAndStats()
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({...prev, status: newStatus}))
        }
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }


  const getBogotaDateString = (date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date); // en-CA gives YYYY-MM-DD
  };

  const isTodayInBogota = (dateString) => {
    if (!dateString) return false;
    const orderDate = new Date(dateString);
    return getBogotaDateString(orderDate) === getBogotaDateString(new Date());
  };

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    const isToday = isTodayInBogota(order.created_at);
    
    if (activeTab === 'NUEVOS / PENDIENTES') return order.status === 'pendiente' && isToday;
    if (activeTab === 'CONFIRMADOS') return ['preparando', 'en_camino'].includes(order.status) && isToday;
    if (activeTab === 'HISTORIAL / CANCELADOS') {
        // Historial: cancelled, delivered, or any status if it's from a past date
        return order.status === 'cancelado' || order.status === 'entregado' || !isToday;
    }
    return true;
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-black uppercase text-slate-800">Pedidos</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm">
            <span className={`font-bold text-sm ${isStoreOpen ? 'text-green-600' : 'text-gray-400'}`}>
              {isStoreOpen ? 'ABIERTO' : 'CERRADO'}
            </span>
            <button 
              onClick={toggleStoreStatus}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isStoreOpen ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isStoreOpen ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-bold">
            Actualizado hace {Math.max(0, Math.floor((now - lastUpdated) / 1000))} segundos
          </span>
          <button onClick={fetchOrdersAndStats} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-black text-slate-400 mb-1 uppercase">Hoy</p>
          <p className="text-3xl font-black text-slate-800">{stats.today_orders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-black text-yellow-500 mb-1 uppercase">Pendientes</p>
          <p className="text-3xl font-black text-slate-800">{stats.pending_orders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-black text-green-600 mb-1 uppercase">Aceptados</p>
          <p className="text-3xl font-black text-slate-800">{stats.accepted_orders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-black text-red-500 mb-1 uppercase">Cancelados</p>
          <p className="text-3xl font-black text-slate-800">{stats.cancelled_orders}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl shadow-sm border border-green-100">
          <p className="text-xs font-black text-green-700 mb-1 uppercase">Recaudado (Ventas)</p>
          <p className="text-3xl font-black text-green-800">${stats.today_revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-12 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <CloudOff size={48} className="mb-4 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-black uppercase tracking-widest">
            NO HAY PEDIDOS EN ESTA SECCIÓN
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="bg-white border-2 border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase mb-0.5">
                    {order.order_number ? `Pedido #${order.order_number}` : `#${order.id.split('-')[0].toUpperCase()}`}
                  </p>
                  <h3 className="font-black text-lg text-gray-800">{order.customer_name}</h3>
                  <p className="text-sm text-gray-500 font-bold">{order.customer_phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                  order.status === 'entregado' ? 'bg-gray-100 text-gray-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="text-sm font-bold text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block mb-1">🚚 {order.delivery_type.toUpperCase()}</span>
                {order.customer_address && <span className="block break-words truncate">📍 {order.customer_address}</span>}
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map(item => (
                  <div key={item.id} className="text-sm font-bold border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="text-gray-800 truncate pr-2">{item.quantity}x {item.variation?.name || 'Item'}</span>
                      <span className="text-gray-500 whitespace-nowrap">${item.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end mb-6 pt-4 border-t-2 border-gray-100 border-dashed">
                <span className="text-xs font-black text-gray-400 uppercase">Total Pedido</span>
                <span className="text-2xl font-black text-red-600">${order.total_price.toLocaleString()}</span>
              </div>

              {order.status === 'pendiente' && (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'preparando', order)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-colors uppercase text-sm"
                  >
                    Aceptar
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'cancelado', order)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-black py-3 rounded-xl transition-colors uppercase text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {order.status === 'preparando' && (
                <div onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'en_camino')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-xl transition-colors uppercase text-sm"
                  >
                    🛵 Salió del restaurante
                  </button>
                </div>
              )}
              {order.status === 'en_camino' && (
                <div onClick={e => e.stopPropagation()}>
                  <div className="w-full bg-blue-100 text-blue-700 font-black py-3 rounded-xl text-center text-sm uppercase">
                    🛵 En camino
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalles del Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase">Detalles del Pedido</h2>
                <p className="text-sm text-gray-500 font-bold mt-1">#{selectedOrder.id.split('-')[0].toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Info Cliente */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6">
                <h3 className="font-black text-yellow-800 uppercase mb-4 text-sm tracking-wider">Información del Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-yellow-600 font-bold uppercase mb-1">Nombre</p>
                    <p className="font-black text-gray-800">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-600 font-bold uppercase mb-1">Teléfono</p>
                    <p className="font-black text-gray-800">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-yellow-600 font-bold uppercase mb-1">Dirección / Tipo</p>
                    <p className="font-black text-gray-800">
                      {selectedOrder.delivery_type.toUpperCase()} 
                      {selectedOrder.customer_address ? ` - ${selectedOrder.customer_address}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items del Pedido */}
              <h3 className="font-black text-gray-400 uppercase mb-4 text-sm tracking-wider">Productos</h3>
              <div className="space-y-4">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="border-2 border-gray-100 rounded-2xl p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-gray-800 text-lg">
                        <span className="text-red-500">{item.quantity}x</span> {item.variation?.name || 'Item'}
                      </h4>
                      <span className="font-black text-green-600">${item.subtotal.toLocaleString()}</span>
                    </div>

                    {item.notes && (
                      <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-lg font-bold italic mb-3">
                        "{item.notes}"
                      </p>
                    )}

                    {item.selected_options?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Adicionales:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.selected_options.map(opt => (
                            <span key={opt.id} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                              {opt.option?.name || 'Opción'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t-2 border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs font-black text-gray-400 uppercase">Total a Cobrar</p>
                <p className="text-3xl font-black text-red-600">${selectedOrder.total_price.toLocaleString()}</p>
                {selectedOrder.delivery_cost > 0 && (
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    Incluye ${selectedOrder.delivery_cost.toLocaleString()} de domicilio
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {selectedOrder.status === 'pendiente' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelado', selectedOrder)}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-sm uppercase transition-colors bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparando', selectedOrder)}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-black text-sm uppercase transition-colors bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200"
                    >
                      Aceptar Pedido
                    </button>
                  </>
                )}
                {selectedOrder.status === 'preparando' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelado', selectedOrder)}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-black text-sm uppercase transition-colors bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'en_camino')}
                      className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-black text-sm uppercase transition-colors bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200"
                    >
                      🛵 Salió del restaurante
                    </button>
                  </>
                )}
                {selectedOrder.status === 'en_camino' && (
                  <div className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-black text-sm uppercase text-center bg-blue-100 text-blue-700">
                    🛵 En camino
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders


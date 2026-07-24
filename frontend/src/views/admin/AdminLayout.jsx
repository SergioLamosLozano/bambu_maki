import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { 
  Package, 
  Folder, 
  Utensils, 
  Tag,
  Pizza,
  Settings,
  LogOut,
  BarChart2
} from 'lucide-react'

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NAV_ITEMS = [
    { name: 'Pedidos', path: '/admin/orders', icon: <Package size={20} /> },
    { name: 'Estadísticas', path: '/admin/statistics', icon: <BarChart2 size={20} /> },
    { name: 'Productos', path: '/admin/products', icon: <Utensils size={20} /> },
    { name: 'Opciones / Precios', path: '/admin/options', icon: <Pizza size={20} /> },
    { name: 'Ajustes', path: '/admin/settings', icon: <Settings size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for Desktop Admin */}
      <aside className="w-64 bg-[#9a1a14] flex flex-col shadow-2xl sticky top-0 h-screen z-10">
        
        {/* Title / Logo Area */}
        <div className="p-6 border-b border-[#a8251e]">
          <h1 className="text-white font-black text-2xl uppercase tracking-tighter leading-none">
            Bambu<span className="text-[#ECDA35]">Maki</span>
          </h1>
          <p className="text-[#fcaea8] text-[10px] uppercase font-bold tracking-widest mt-1">
            Centro de Control
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path) || (location.pathname === '/admin' && item.path === '/admin/orders')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-4 mx-2 rounded-xl text-sm font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d94f47] to-[#ba2d25] text-white shadow-md'
                    : 'text-[#fcaea8] hover:bg-[#aa231c] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Logo & Logout */}
        <div className="p-4 border-t border-[#a8251e] flex flex-col items-center">
          <img 
            src="/BAMBUlogo.png" 
            alt="Bambu Maki" 
            className="w-16 h-16 object-contain mb-4 bg-white rounded-full shadow p-2"
          />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#ECDA35] hover:bg-[#d4c32b] text-[#9a1a14] font-black py-3 rounded-xl uppercase tracking-wider text-sm transition-colors shadow"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout

import React from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ClientLayout from './views/client/ClientLayout'
import AdminLayout from './views/admin/AdminLayout'

// Client Views
import Home from './views/client/Home'
import ProductBuilder from './views/client/ProductBuilder'
import Cart from './views/client/Cart'

// Admin Views
import Orders from './views/admin/Orders'
import Products from './views/admin/Products'
import Login from './views/admin/Login'
import Options from './views/admin/Options'
import Settings from './views/admin/Settings'
import Statistics from './views/admin/Statistics'
import { useAuthStore } from './store/authStore'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Client Routes */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="build/:type/:id" element={<ProductBuilder />} />
          <Route path="cart" element={<Cart />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="options" element={<Options />} />
          <Route path="settings" element={<Settings />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

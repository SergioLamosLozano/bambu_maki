import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FC2803] via-[#ff6b3d] to-[#ECDA35] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          
          <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
            <img
              className="mx-auto h-24 w-auto mb-2"
              src="/BAMBUlogo.png"
              alt="Bambu Maki"
            />
            <h2 className="text-3xl font-black text-[#FC2803]">
              Bambu<span className="text-[#ECDA35]">Maki</span>
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
              Panel de Administración
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-100 border-none rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FC2803] sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-100 border-none rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FC2803] sm:text-sm transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-black text-white bg-[#FC2803] hover:bg-[#d62202] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FC2803] disabled:opacity-50 uppercase tracking-wide transition-colors"
              >
                {isLoading ? 'Iniciando...' : 'Acceder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

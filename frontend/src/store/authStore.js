import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          // OAuth2 requires form data
          const formData = new URLSearchParams()
          formData.append('username', email)
          formData.append('password', password)

          const response = await axios.post(`${API_URL}/auth/login`, formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })

          const { access_token } = response.data
          
          // Get user details
          const userResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${access_token}`
            }
          })

          set({
            token: access_token,
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true
        } catch (error) {
          set({ 
            error: error.response?.data?.detail || 'Error al iniciar sesión',
            isLoading: false 
          })
          return false
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'bambumaki-auth-storage', // key in local storage
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

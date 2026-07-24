import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      
      addItem: (item) => {
        set((state) => ({
          cartItems: [...state.cartItems, { ...item, quantity: 1 }]
        }))
      },
      
      removeFromCart: (cartId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.cartId !== cartId)
        }))
      },

      duplicateItemBase: (item) => {
        set((state) => {
          const baseItem = {
            ...item,
            cartId: `${item.id}-${Date.now()}`,
            quantity: 1,
            selections: [], // Clear all extras
            finalPrice: item.base_price || item.price // Fallback to base price without extras
          }
          return {
            cartItems: [...state.cartItems, baseItem]
          }
        })
      },

      updateQuantity: (cartId, quantity) => {
        set((state) => ({
          cartItems: state.cartItems.map((i) => 
            i.cartId === cartId ? { ...i, quantity: Math.max(1, quantity) } : i
          )
        }))
      },
      
      clearCart: () => set({ cartItems: [] }),

      getTotal: () => {
        const { cartItems } = get()
        return cartItems.reduce((total, item) => {
          return total + (item.finalPrice * item.quantity)
        }, 0)
      }
    }),
    {
      name: 'bambu-maki-cart', // local storage key
    }
  )
)

export default useCartStore;

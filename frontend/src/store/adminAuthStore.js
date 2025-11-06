import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      setAuth: (admin, token) => {
        set({
          admin,
          token,
          isAuthenticated: true,
        })
      },

      updateAdmin: (admin) => {
        set({ admin })
      },

      logout: () => {
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'admin-auth-storage',
      getStorage: () => localStorage,
    }
  )
)


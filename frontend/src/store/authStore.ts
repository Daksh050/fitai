import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: number
  email: string
  username: string
  full_name?: string
  age?: number
  weight_kg?: number
  height_cm?: number
  gender?: string
  goal?: string
  activity_level?: string
  dietary_preference?: string
  bmr?: number
  tdee?: number
  target_calories?: number
  target_protein_g?: number
  target_carbs_g?: number
  target_fat_g?: number
  is_onboarded: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; username: string; password: string; full_name?: string }) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  fetchProfile: () => Promise<void>
}

const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await API.post('/auth/login', { email, password })
          set({ token: data.access_token, user: data.user, isLoading: false })
        } catch (e: any) {
          set({ error: e.response?.data?.detail || 'Login failed', isLoading: false })
          throw e
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await API.post('/auth/register', payload)
          set({ token: data.access_token, user: data.user, isLoading: false })
        } catch (e: any) {
          set({ error: e.response?.data?.detail || 'Registration failed', isLoading: false })
          throw e
        }
      },

      logout: () => set({ user: null, token: null, error: null }),

      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),

      fetchProfile: async () => {
        try {
          const { data } = await API.get('/users/me')
          set({ user: data })
        } catch {
          // token expired
          set({ user: null, token: null })
        }
      },
    }),
    {
      name: 'fitai-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
)

export { API }

import { useMutation, useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const navigate = useNavigate()
  const { setAuth, logout: logoutStore } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation(
    ({ email, password }) => authService.login(email, password),
    {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data.data
        setAuth(user, accessToken, refreshToken)
        toast.success('Giriş başarılı!')
        navigate('/dashboard')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Giriş başarısız')
      },
    }
  )

  // Register mutation
  const registerMutation = useMutation(
    (data) => authService.register(data),
    {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data.data
        setAuth(user, accessToken, refreshToken)
        toast.success('Kayıt başarılı!')
        navigate('/dashboard')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Kayıt başarısız')
      },
    }
  )

  // Logout mutation
  const logoutMutation = useMutation(
    () => authService.logout(),
    {
      onSuccess: () => {
        logoutStore()
        toast.success('Çıkış yapıldı')
        navigate('/login')
      },
      onError: () => {
        logoutStore()
        navigate('/login')
      },
    }
  )

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    'currentUser',
    () => authService.getMe(),
    {
      enabled: !!useAuthStore.getState().accessToken,
      retry: false,
      onError: () => {
        logoutStore()
      },
    }
  )

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isLoading,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isLoading,
    currentUser: currentUser?.data?.user,
    isLoadingUser,
  }
}


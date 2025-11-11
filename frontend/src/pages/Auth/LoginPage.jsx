import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Common/Button'

const LoginPage = () => {
  const { login, isLoggingIn, loginError } = useAuth()
  const { accessToken } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Eğer kullanıcı zaten login olmuşsa, dashboard'a yönlendir
    if (accessToken) {
      navigate('/dashboard', { replace: true })
    }
  }, [accessToken, navigate])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = (data) => {
    login({ email: data.email, password: data.password })
  }

  const errorMessage = loginError?.response?.data?.message || 
    (loginError ? 'Kullanıcı adı veya şifre yanlış!' : '')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/img/logo.png" alt="Chronis Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
           Chronis Monitoring System
          </h1>
          <p className="text-gray-300">Hesabınıza giriş yapın</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="ornek@email.com"
                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                {...register('email', {
                  required: 'Email zorunludur',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Geçerli bir email adresi giriniz',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                {...register('password', {
                  required: 'Şifre zorunludur',
                  minLength: {
                    value: 6,
                    message: 'Şifre en az 6 karakter olmalıdır',
                  },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500 bg-gray-800"
                />
                <span className="ml-2 text-gray-400">Beni hatırla</span>
              </label>
            </div>

            {errorMessage && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoggingIn}
            >
              Giriş Yap
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


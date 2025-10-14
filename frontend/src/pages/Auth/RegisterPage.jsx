import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/Common/Button'
import Input from '../../components/Common/Input'

const RegisterPage = () => {
  const { register: registerUser, isRegistering } = useAuth()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = (data) => {
    const { confirmPassword, ...registerData } = data
    registerUser(registerData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            BMC MainView
          </h1>
          <p className="text-gray-600">Yeni hesap oluşturun</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="İsim"
                placeholder="İsim"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'İsim zorunludur',
                })}
              />

              <Input
                label="Soyisim"
                placeholder="Soyisim"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Soyisim zorunludur',
                })}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="ornek@email.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email zorunludur',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Geçerli bir email adresi giriniz',
                },
              })}
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Şifre zorunludur',
                minLength: {
                  value: 6,
                  message: 'Şifre en az 6 karakter olmalıdır',
                },
              })}
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Şifre tekrarı zorunludur',
                validate: (value) =>
                  value === password || 'Şifreler eşleşmiyor',
              })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isRegistering}
            >
              Kayıt Ol
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Zaten hesabınız var mı? </span>
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Giriş yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage


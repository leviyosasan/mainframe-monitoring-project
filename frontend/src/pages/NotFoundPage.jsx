import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/Common/Button'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-gray-600 mt-2 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage


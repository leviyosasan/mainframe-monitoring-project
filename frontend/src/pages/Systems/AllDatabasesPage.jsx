import { Link } from 'react-router-dom'

const AllDatabasesPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tüm Veritabanları</h1>
        <p className="text-gray-600">Servisleri görüntüleyin, durumlarını kontrol edin ve detay sayfalarına geçin.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PostgreSQL */}
        <Link to="/postgresql" className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-blue-50 to-transparent" />
          <div className="relative flex items-center gap-4">
            {/* PostgreSQL Logo (SVG) */}
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
              <svg viewBox="0 0 256 256" className="h-7 w-7 text-blue-600" fill="currentColor" aria-hidden>
                <path d="M222.9 118.7c-4.6-14.5-16-24.5-33.9-30.1c-1.7-.5-3.4-1-5.2-1.4c-2.7-.7-5.4-1.3-8.2-1.9c-5.7-15.2-14.4-25.7-26-31.5c-19.6-9.7-43.9-5.1-67.7 12.6c-18.5 13.9-30.7 31.1-32.1 44.6c-1.1 10.2 3.5 18.1 13.8 22.9c-3.7 10-4.4 19.3-1.9 27.7c4.9 16.4 21 26.5 46.9 30.1c9.7 1.3 17.5-.2 23.2-4.3c6-4.3 9.3-11.1 9.9-20.1c10.2-1.7 18.6-4.1 25.1-7.2c14.2-6.9 23.5-18.1 27.6-33.2c18.1 6.4 24.6 18 19.2 35.7c-2.2 7.2-6.2 13.7-12 19.6c-2.6 2.7-2.7 7-.1 9.7c2.6 2.7 7 .2 9.7-2.4c7.6-7.8 12.7-16.3 15.4-25.4c4.7-15.6 3.1-30-4.7-43.1z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">PostgreSQL</h3>
              <p className="text-sm text-gray-500">Aç, izle ve yönet</p>
            </div>
          </div>
        </Link>

        {/* MSSQL */}
        <Link to="/mssql" className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-emerald-50 to-transparent" />
          <div className="relative flex items-center gap-4">
            {/* MSSQL Logo (SVG basitleştirilmiş) */}
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-600" fill="currentColor" aria-hidden>
                <path d="M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm12-1.172V9h4.172L16 4.828z" />
                <path d="M8 12h8v2H8v-2zm0 3h8v2H8v-2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">MSSQL</h3>
              <p className="text-sm text-gray-500">Aç, izle ve yönet</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default AllDatabasesPage



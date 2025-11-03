import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Chatbot from '../Common/Chatbot'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="ml-16 p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Chatbot />
    </div>
  )
}

export default Layout


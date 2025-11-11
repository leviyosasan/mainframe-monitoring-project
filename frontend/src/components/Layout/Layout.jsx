import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Chatbot from '../Common/Chatbot'
import { useEffect, useState } from 'react'

const Layout = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('app_sidebar_expanded')
    if (saved === '1') setIsExpanded(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('app_sidebar_expanded', isExpanded ? '1' : '0')
  }, [isExpanded])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <main className={`${isExpanded ? 'ml-48' : 'ml-14'} transition-all duration-300 p-8`}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Chatbot />
    </div>
  )
}

export default Layout


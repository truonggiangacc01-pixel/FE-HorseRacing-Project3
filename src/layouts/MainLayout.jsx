import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import Navbar from '../components/Navbar/Navbar'
import '../styles/admin-layout.css'
import '../styles/admin-common.css'

export default function MainLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Navbar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onAddClick={() => setIsAddModalOpen(true)} 
        />
        <div className="admin-content">
          <Outlet context={{ searchQuery, setSearchQuery, isAddModalOpen, setIsAddModalOpen }} />
        </div>
      </div>
    </div>
  )
}

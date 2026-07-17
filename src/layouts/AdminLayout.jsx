import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import '../styles/admin-layout.css'
import '../styles/admin-common.css'

export default function AdminLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()

  // Clear search query when the route/page changes
  useEffect(() => {
    setSearchQuery('')
  }, [location.pathname])

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="admin-content">
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </div>
      </div>
    </div>
  )
}

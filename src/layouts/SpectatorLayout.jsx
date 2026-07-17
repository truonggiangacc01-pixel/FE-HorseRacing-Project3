import React from 'react'
import { Outlet } from 'react-router-dom'
import SpectatorSidebar from '../components/spectator/SpectatorSidebar'
import SpectatorHeader from '../components/spectator/SpectatorHeader'
import '../styles/admin-layout.css'
import '../styles/admin-common.css'

export default function SpectatorLayout() {
  return (
    <div className="admin-shell">
      <SpectatorSidebar />
      <div className="admin-main">
        <SpectatorHeader />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

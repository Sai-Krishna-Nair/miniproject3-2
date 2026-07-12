import React from 'react'
import { LayoutDashboard, Map as MapIcon, Camera, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface AppLayoutProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { role, signOut } = useAuth()

  return (
    <div className="app-container">
      
      {/* App Header */}
      <header className="header">
        <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#000000' }}>spothole.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`role-badge ${role}`}>
            {role}
          </span>
          <button 
            onClick={signOut} 
            title="Log Out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="content-area">
        {children}
      </main>

      {/* Bottom/Top Navigation Tabs */}
      <nav className="nav-bar">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapIcon />
          <span>Map</span>
        </button>

        {role === 'citizen' && (
          <button 
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <Camera />
            <span>Report</span>
          </button>
        )}

        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User />
          <span>Profile</span>
        </button>
      </nav>

    </div>
  )
}

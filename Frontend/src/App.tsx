import React, { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/Layout/AppLayout'
import { AuthView } from './components/Auth/AuthView'
import { LandingView } from './components/Landing/LandingView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { MapView } from './components/Map/MapView'
import { SubmitReportView } from './components/Reports/SubmitReportView'
import { ReportDetailView } from './components/Reports/ReportDetailView'
import { ProfileView } from './components/Profile/ProfileView'

function AppContent() {
  const { user, loading, role } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  
  // Landing page routing states
  const [landingViewState, setLandingViewState] = useState<'landing' | 'auth'>('landing')
  const [authMode, setAuthMode] = useState<'citizen' | 'authority'>('citizen')
  const [authSignUp, setAuthSignUp] = useState<boolean>(false)

  // Reset to landing view on logout
  React.useEffect(() => {
    if (!user) {
      setLandingViewState('landing')
    }
  }, [user])

  // Redirect non-citizens away from the 'report' tab
  // (Done in useEffect, NOT during render, to avoid setState-during-render)
  React.useEffect(() => {
    if (activeTab === 'report' && role !== 'citizen') {
      setActiveTab('dashboard')
    }
  }, [activeTab, role])

  // Full page load gating
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ marginTop: '1.25rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
          Syncing secure keypair...
        </p>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    if (landingViewState === 'landing') {
      return (
        <LandingView 
          onRouteToAuth={(mode, isSignUp) => {
            setAuthMode(mode)
            setAuthSignUp(isSignUp)
            setLandingViewState('auth')
          }} 
        />
      )
    }

    return (
      <AuthView 
        initialIsSignUp={authSignUp}
        initialShowInviteCode={authMode === 'authority'}
        onBackToLanding={() => setLandingViewState('landing')} 
      />
    )
  }

  // Handle detailed report inspection override
  const handleViewReport = (id: string) => {
    setSelectedReportId(id)
  }

  const handleBackToTab = () => {
    setSelectedReportId(null)
  }

  const renderActiveView = () => {
    if (selectedReportId) {
      return (
        <ReportDetailView 
          reportId={selectedReportId} 
          onBack={handleBackToTab} 
        />
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onViewReport={handleViewReport} />
      case 'map':
        return <MapView onViewReport={handleViewReport} />
      case 'report':
        if (role !== 'citizen') {
          // useEffect above will redirect; show dashboard in the meantime
          return <DashboardView onViewReport={handleViewReport} />
        }
        return (
          <SubmitReportView 
            onSuccess={(newId) => {
              setSelectedReportId(newId)
            }} 
          />
        )
      case 'profile':
        return <ProfileView />
      default:
        return <DashboardView onViewReport={handleViewReport} />
    }
  }

  const handleTabChange = (tab: string) => {
    // Navigating via tab clears the active details page override
    setSelectedReportId(null)
    setActiveTab(tab)
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {renderActiveView()}
    </AppLayout>
  )
}

function App() {
  return <AppContent />
}

export default App

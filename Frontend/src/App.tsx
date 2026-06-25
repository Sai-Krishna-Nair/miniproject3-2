import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/Layout/AppLayout'
import { AuthView } from './components/Auth/AuthView'
import { DashboardView } from './components/Dashboard/DashboardView'
import { MapView } from './components/Map/MapView'
import { SubmitReportView } from './components/Reports/SubmitReportView'
import { ReportDetailView } from './components/Reports/ReportDetailView'
import { ProfileView } from './components/Profile/ProfileView'

function AppContent() {
  const { user, loading, role } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

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
    return <AuthView />
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
          setActiveTab('dashboard')
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

import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { FileText, Clock, CheckCircle } from 'lucide-react'

interface StatsData {
  total_reports: number
  pending_repairs: number
  fixed_repairs: number
  repair_rate_percentage: number
}

interface ReportItem {
  id: string
  reported_by: string
  reporter_name?: string
  latitude: number
  longitude: number
  status: 'pending' | 'fixed'
  before_image_url: string
  after_image_url: string | null
  created_at: string
  priority?: number
}

export const DashboardView: React.FC<{ onViewReport: (id: string) => void }> = ({ onViewReport }) => {
  const { profile } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listTab, setListTab] = useState<'my' | 'pending' | 'fixed'>('my')

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const statsResponse = await api.get<{ success: boolean; data: StatsData }>('/api/v1/stats/dashboard')
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      const response = await api.get<{ success: boolean; data: ReportItem[] }>('/api/v1/reports')
      // Sort reports by created_at desc
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setReports(sorted)
    } catch (err: any) {
      setError(err.message || 'Could not load dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '1rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>
          Syncing dashboard...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="centered-msg-box">
        <div className="badge badge-outline" style={{ padding: '0.8rem', color: '#000', textTransform: 'none' }}>
          Error: {error}
        </div>
        <button className="btn btn-primary btn-small" onClick={loadDashboardData}>
          Retry Connection
        </button>
      </div>
    )
  }

  const myReports = reports.filter((r) => r.reported_by === profile?.id)
  const pendingReports = reports.filter((r) => r.status === 'pending')
  const fixedReports = reports.filter((r) => r.status === 'fixed')

  const renderReportList = (list: ReportItem[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {emptyMsg}
        </div>
      )
    }

    return (
      <div className="dashboard-list-items">
        {list.map((report) => (
          <div 
            key={report.id} 
            className="list-item"
            style={{ cursor: 'pointer', padding: '0.75rem 0', borderBottom: '1px solid #e5e5e5' }}
            onClick={() => onViewReport(report.id)}
          >
            <img 
              src={report.before_image_url} 
              alt="Pothole" 
              className="list-item-avatar"
              style={{ width: '45px', height: '45px', borderRadius: '8px', border: 'none' }}
            />
            <div className="list-item-content" style={{ minWidth: 0 }}>
              <div className="flex-row-between" style={{ gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  #{report.id.substring(0, 8)}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className={`badge ${report.status === 'fixed' ? 'badge-solid' : 'badge-outline'}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }}>
                    {report.status}
                  </span>
                  <span className="badge badge-outline" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem', borderStyle: 'dashed', textTransform: 'none' }}>
                    Prio: {report.priority ?? 1}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Reported by: <strong>{report.reporter_name || 'Unknown Citizen'}</strong>
              </p>
              <div className="flex-row-between" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="text-muted-desc">Welcome Back</span>
        <h1 style={{ marginTop: '0.2rem' }}>{profile?.full_name || 'Infrastructure App'}</h1>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="card card-stark" style={{ padding: '1rem' }}>
          <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Need Repair</span>
          <div className="stat-num">{stats?.pending_repairs ?? 0}</div>
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>PENDING</span>
        </div>

        <div className="card card-stark" style={{ padding: '1rem' }}>
          <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Resolved</span>
          <div className="stat-num">{stats?.fixed_repairs ?? 0}</div>
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>FIXED</span>
        </div>

        <div className="card card-stark" style={{ padding: '1rem' }}>
          <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Repair Rate</span>
          <div className="stat-num">
            {stats?.repair_rate_percentage !== undefined ? Math.round(stats.repair_rate_percentage) : 0}%
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>RATE</span>
        </div>
      </div>

      {/* Repair Rate Stark Progress Indicator */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="flex-row-between" style={{ marginBottom: '0.5rem' }}>
          <span className="form-label" style={{ margin: 0 }}>System Repair Completion</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>
            {stats?.repair_rate_percentage?.toFixed(1) ?? '0.0'}%
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#fafafa', borderRadius: '6px', padding: '1px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              backgroundColor: '#000000', 
              width: `${stats?.repair_rate_percentage ?? 0}%`,
              transition: 'width 0.5s ease-out',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Mobile list switcher */}
      <div className="toggle-group mobile-only-toggle" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`toggle-option ${listTab === 'my' ? 'active' : ''}`}
          onClick={() => setListTab('my')}
        >
          My Reports
        </button>
        <button
          type="button"
          className={`toggle-option ${listTab === 'pending' ? 'active' : ''}`}
          onClick={() => setListTab('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={`toggle-option ${listTab === 'fixed' ? 'active' : ''}`}
          onClick={() => setListTab('fixed')}
        >
          Fixed
        </button>
      </div>

      {/* 3 columns lists container */}
      <div className="dashboard-lists-container">
        
        {/* Column 1: My Reports */}
        <div className={`dashboard-list-column ${listTab === 'my' ? 'mobile-active' : ''}`}>
          <div className="dashboard-list-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={14} /> My Reports
            </span>
            <span className="badge badge-solid" style={{ fontSize: '0.6rem' }}>{myReports.length}</span>
          </div>
          {renderReportList(myReports, 'You have not reported any potholes.')}
        </div>

        {/* Column 2: Pending Reports */}
        <div className={`dashboard-list-column ${listTab === 'pending' ? 'mobile-active' : ''}`}>
          <div className="dashboard-list-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Pending Potholes
            </span>
            <span className="badge badge-outline" style={{ fontSize: '0.6rem' }}>{pendingReports.length}</span>
          </div>
          {renderReportList(pendingReports, 'No pending potholes found.')}
        </div>

        {/* Column 3: Fixed Reports */}
        <div className={`dashboard-list-column ${listTab === 'fixed' ? 'mobile-active' : ''}`}>
          <div className="dashboard-list-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={14} /> Fixed Potholes
            </span>
            <span className="badge badge-solid" style={{ fontSize: '0.6rem' }}>{fixedReports.length}</span>
          </div>
          {renderReportList(fixedReports, 'No fixed potholes found.')}
        </div>

      </div>
    </div>
  )
}

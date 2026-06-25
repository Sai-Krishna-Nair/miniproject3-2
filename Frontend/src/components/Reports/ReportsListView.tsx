import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Search, SlidersHorizontal } from 'lucide-react'

interface ReportItem {
  id: string
  reported_by: string
  latitude: number
  longitude: number
  status: 'pending' | 'fixed'
  before_image_url: string
  after_image_url: string | null
  created_at: string
}

interface ReportsListViewProps {
  onViewReport: (id: string) => void
}

export const ReportsListView: React.FC<ReportsListViewProps> = ({ onViewReport }) => {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fixed'>('all')

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<{ success: boolean; data: ReportItem[] }>('/api/v1/reports')
      // Sort desc
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setReports(sorted)
      setFilteredReports(sorted)
    } catch (err: any) {
      setError(err.message || 'Could not fetch list of reported potholes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Apply filters when reports, statusFilter, or searchTerm changes
  useEffect(() => {
    let result = [...reports]

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }

    // Search filter (searches UUID prefix, coordinates, or dates)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(term) ||
          r.latitude.toString().includes(term) ||
          r.longitude.toString().includes(term) ||
          new Date(r.created_at).toLocaleDateString().includes(term)
      )
    }

    setFilteredReports(result)
  }, [reports, statusFilter, searchTerm])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '1rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>
          Loading records...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="centered-msg-box">
        <div className="badge badge-outline" style={{ padding: '0.8rem', color: '#000' }}>
          Error: {error}
        </div>
        <button className="btn btn-primary btn-small" onClick={fetchReports}>
          Reload List
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="text-muted-desc">Status Records</span>
        <h1 style={{ marginTop: '0.2rem' }}>Pothole Ledger</h1>
      </div>

      {/* Search Bar Widget */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search 
          size={16} 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search reports by ID, coordinates, date..."
          style={{ paddingLeft: '2.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Options */}
      <div className="toggle-group" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`toggle-option ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`toggle-option ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={`toggle-option ${statusFilter === 'fixed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('fixed')}
        >
          Fixed
        </button>
      </div>

      {/* List count summary */}
      <div className="flex-row-between" style={{ marginBottom: '1rem', borderBottom: '1px solid #000', paddingBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Found {filteredReports.length} Reports
        </span>
        <SlidersHorizontal size={14} />
      </div>

      {/* Reports Stack */}
      {filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p>No reports match your filters.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <div 
              key={report.id}
              className="card card-stark"
              style={{ display: 'flex', flexDirection: 'row', gap: '1rem', padding: '1rem', cursor: 'pointer', alignItems: 'center' }}
              onClick={() => onViewReport(report.id)}
            >
              <img 
                src={report.before_image_url} 
                alt="Pothole before" 
                style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1.5px solid #000000', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-row-between" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                    REPORT #{report.id.substring(0, 8)}
                  </span>
                  <span className={`badge ${report.status === 'fixed' ? 'badge-solid' : 'badge-outline'}`} style={{ fontSize: '0.55rem' }}>
                    {report.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  LAT: {report.latitude.toFixed(5)}<br/>
                  LON: {report.longitude.toFixed(5)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  LOGGED: {new Date(report.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, MapPin, Camera, Check, ExternalLink } from 'lucide-react'

interface ReportDetail {
  id: string
  reported_by: string
  reporter_name?: string
  latitude: number
  longitude: number
  status: 'pending' | 'fixed'
  before_image_url: string
  after_image_url: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  resolver_name?: string | null
  priority?: number
}

interface ReportDetailViewProps {
  reportId: string
  onBack: () => void
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({ reportId, onBack }) => {
  const { role } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Resolution states
  const [resolving, setResolving] = useState(false)
  const [resolutionImage, setResolutionImage] = useState<File | null>(null)
  const [resolutionPreview, setResolutionPreview] = useState<string | null>(null)
  const [resolutionError, setResolutionError] = useState<string | null>(null)
  const [resolutionSuccess, setResolutionSuccess] = useState(false)

  const loadReportDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<{ success: boolean; data: ReportDetail }>(`/api/v1/reports/${reportId}`)
      setReport(response.data)
    } catch (err: any) {
      setError(err.message || 'Could not fetch report details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportDetails()
  }, [reportId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Client-side validation
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
      const maxFileSize = 10 * 1024 * 1024 // 10MB

      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.type)) {
        setResolutionError(`Invalid file type. Only ${allowedExtensions.join(', ')} images are allowed.`)
        setResolutionImage(null)
        setResolutionPreview(null)
        if (e.target) e.target.value = ''
        return
      }

      if (file.size > maxFileSize) {
        setResolutionError('File is too large. Maximum allowed size is 10MB.')
        setResolutionImage(null)
        setResolutionPreview(null)
        if (e.target) e.target.value = ''
        return
      }

      setResolutionImage(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setResolutionPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      setResolutionError(null)
      setResolutionSuccess(false)
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolutionImage) {
      setResolutionError('Please select or snap a resolution photo.')
      return
    }

    setResolving(true)
    setResolutionError(null)

    try {
      const formData = new FormData()
      formData.append('image', resolutionImage)

      await api.postMultipart(`/api/v1/reports/${reportId}/resolve`, formData)
      
      setResolutionSuccess(true)
      setResolutionImage(null)
      setResolutionPreview(null)
      
      // Reload report details to show updated status
      await loadReportDetails()
    } catch (err: any) {
      // Backend returns YOLO feedback on failure
      setResolutionError(err.message || 'Verification failed. The pothole may still be detected.')
    } finally {
      setResolving(false)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '1rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>
          Retrieving file details...
        </p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="centered-msg-box">
        <div className="badge badge-outline" style={{ padding: '0.8rem', color: '#000', marginBottom: '1rem' }}>
          {error || 'Report not found.'}
        </div>
        <button className="btn btn-primary btn-small" onClick={onBack}>
          <ArrowLeft size={12} /> BACK TO LIST
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Back navigation header */}
      <button 
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginBottom: '1.25rem' }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> Back to reports
      </button>

      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex-row-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <span className="text-muted-desc">Unique Record ID</span>
            <h1 style={{ marginTop: '0.2rem', fontSize: '1.3rem' }}>#{report.id.substring(0, 16)}...</h1>
          </div>
          <span className={`badge ${report.status === 'fixed' ? 'badge-solid' : 'badge-outline'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}>
            {report.status}
          </span>
        </div>
      </div>

      {/* Details Box */}
      <div className="card card-stark" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div className="flex-row-between">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Reported At</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{new Date(report.created_at).toLocaleString()}</span>
          </div>

          <div className="flex-row-between">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Reported By</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{report.reporter_name || 'Unknown Citizen'}</span>
          </div>

          <div className="flex-row-between" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Report Priority</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#EF4444' }}>▲ {report.priority ?? 1} (Reports)</span>
          </div>

          <div className="flex-row-between" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
              <MapPin size={12} /> GPS Grid Coordinates
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </span>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-small"
              style={{ width: '100%', textDecoration: 'none' }}
            >
              OPEN MAP NAVIGATION <ExternalLink size={12} style={{ marginLeft: '4px' }} />
            </a>
          </div>

        </div>
      </div>

      {/* Image displays */}
      <div className="detail-images-grid" style={{ marginBottom: '2rem' }}>
        
        {/* Before photo */}
        <div>
          <span className="form-label" style={{ marginBottom: '0.5rem' }}>CITIZEN REPORT PHOTO (BEFORE)</span>
          <img 
            src={report.before_image_url} 
            alt="Pothole Before" 
            style={{ width: '100%', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', objectFit: 'cover', maxHeight: '300px' }}
          />
        </div>

        {/* Resolved status details */}
        {report.status === 'fixed' && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '1.5rem' }}>
            <div className="card card-stark" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>Resolution audit log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div className="flex-row-between">
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.65rem' }}>Resolved By</span>
                  <span>{report.resolver_name || 'Unknown Authority'}</span>
                </div>
                <div className="flex-row-between">
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.65rem' }}>Resolved At</span>
                  <span>{report.resolved_at ? new Date(report.resolved_at).toLocaleString() : ''}</span>
                </div>
              </div>
            </div>

            <span className="form-label" style={{ marginBottom: '0.5rem' }}>REPAIR VERIFICATION PHOTO (AFTER)</span>
            {report.after_image_url ? (
              <img 
                src={report.after_image_url} 
                alt="Pothole After" 
                style={{ width: '100%', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', objectFit: 'cover', maxHeight: '300px' }}
              />
            ) : (
              <p style={{ fontStyle: 'italic' }}>After image unavailable.</p>
            )}
          </div>
        )}

      </div>

      {/* Authority Resolution Form */}
      {report.status === 'pending' && role === 'authority' && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
          <div className="card card-stark" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', borderBottom: 'none', padding: '0', margin: '0 0 1rem 0' }}>Verify Resolution</h2>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              Capture or upload a photo of the completed road repair. The backend AI model will inspect the image to verify the pothole is completely resolved.
            </p>

            <form onSubmit={handleResolveSubmit}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              {/* Photo preview/placeholder */}
              <div className="camera-container" onClick={triggerFileInput}>
                {resolutionPreview ? (
                  <img src={resolutionPreview} alt="Verification Preview" className="camera-preview" />
                ) : (
                  <div className="camera-placeholder">
                    <Camera />
                    <span>TAP TO SNAP REPAIR PHOTO</span>
                  </div>
                )}
              </div>

              {resolutionError && (
                <div className="badge badge-outline" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', color: '#000', borderColor: '#000', marginBottom: '1.25rem', textTransform: 'none', fontWeight: '500' }}>
                  VERIFICATION ERROR: {resolutionError}
                </div>
              )}

              {resolutionSuccess && (
                <div className="badge badge-solid" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', marginBottom: '1.25rem' }}>
                  <Check size={12} style={{ marginRight: '4px' }} /> POTHOLE SUCCESSFULLY RESOLVED
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary ${resolving || !resolutionImage ? 'btn-disabled' : ''}`}
                disabled={resolving || !resolutionImage}
              >
                {resolving ? (
                  <div className="spinner" style={{ borderTopColor: '#fff', margin: '0 auto' }}></div>
                ) : (
                  'SUBMIT RESOLUTION FOR AI AUDIT'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

import React, { useEffect, useState, useRef } from 'react'
import { api } from '../../lib/api'
import { Camera, MapPin, Check, RefreshCw, Image as ImageIcon } from 'lucide-react'

interface SubmitReportViewProps {
  onSuccess: (newReportId: string) => void
}

export const SubmitReportView: React.FC<SubmitReportViewProps> = ({ onSuccess }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch coordinates using Geolocation API
  const fetchLocation = () => {
    setLocating(true)
    setLocationError(null)
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLon(position.coords.longitude)
        setLocating(false)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        setLocationError('Unable to retrieve your location. Make sure GPS is enabled and HTTPS/localhost is used.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    fetchLocation()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      setSubmitError(null)
      setSubmitSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lat === null || lon === null) {
      setSubmitError('GPS location coordinates are required. Please fetch location first.')
      return
    }
    if (!image) {
      setSubmitError('Pothole image is required. Please capture or upload a photo.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('latitude', lat.toString())
      formData.append('longitude', lon.toString())
      formData.append('image', image) // Backend expects 'image'

      // FastAPI response model includes report_id or data
      const response = await api.postMultipart<{ success: boolean; report_id: string }>(
        '/api/v1/reports',
        formData
      )
      
      setSubmitSuccess(true)
      setImage(null)
      setImagePreview(null)
      
      // Navigate to details page after brief delay
      setTimeout(() => {
        onSuccess(response.report_id)
      }, 1000)

    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Pothole verification or duplicate check blocked request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="text-muted-desc">Citizen Reporting</span>
        <h1 style={{ marginTop: '0.2rem' }}>Log New Pothole</h1>
      </div>

      <form onSubmit={handleSubmit} className="report-form-layout">
        
        {/* GPS Card Panel */}
        <div className="card card-stark" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="flex-row-between" style={{ marginBottom: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={12} /> GPS Grid Position
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={fetchLocation}
              disabled={locating}
              style={{ padding: '0.35rem 0.5rem', width: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
            >
              <RefreshCw size={10} className={locating ? 'spinner' : ''} /> {locating ? 'FETCHING' : 'REFRESH'}
            </button>
          </div>

          {locationError ? (
            <p style={{ fontSize: '0.75rem', color: '#000', fontWeight: '500' }}>
              {locationError}
            </p>
          ) : (
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>LATITUDE</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'monospace' }}>
                  {lat !== null ? lat.toFixed(6) : '—'}
                </div>
              </div>
              <div>
                <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>LONGITUDE</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'monospace' }}>
                  {lon !== null ? lon.toFixed(6) : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {/* Snap widget wrapper */}
        <div className="form-group">
          <label className="form-label">Evidence Capture (Pothole Photo)</label>
          
          <div className="camera-container" style={{ cursor: 'default' }}>
            {imagePreview ? (
              <img src={imagePreview} alt="Pothole Preview" className="camera-preview" />
            ) : (
              <div className="camera-placeholder">
                <Camera />
                <span>NO IMAGE SELECTED</span>
              </div>
            )}
          </div>

          {/* Action buttons to trigger Camera vs Gallery */}
          <div className="camera-buttons-grid">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => cameraInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Camera size={14} /> USE CAMERA
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => galleryInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <ImageIcon size={14} /> FROM GALLERY
            </button>
          </div>
        </div>

        {submitError && (
          <div className="badge badge-outline" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', color: '#000', borderColor: '#000', marginBottom: '1.25rem', textTransform: 'none', fontWeight: '500' }}>
            SUBMISSION FAILED: {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="badge badge-solid" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', marginBottom: '1.25rem' }}>
            <Check size={12} style={{ marginRight: '4px' }} /> POTHOLE VERIFIED AND LOGGED
          </div>
        )}

        <button
          type="submit"
          className={`btn btn-primary report-form-submit-btn ${(submitting || lat === null || lon === null || !image) ? 'btn-disabled' : ''}`}
          disabled={submitting || lat === null || lon === null || !image}
          style={{ padding: '1rem' }}
        >
          {submitting ? (
            <div className="spinner" style={{ borderTopColor: '#fff', margin: '0 auto' }}></div>
          ) : (
            'VERIFY'
          )}
        </button>

      </form>
    </div>
  )
}

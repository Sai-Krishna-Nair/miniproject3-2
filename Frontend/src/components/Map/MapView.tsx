import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { api } from '../../lib/api'
import { Compass } from 'lucide-react'

interface ReportItem {
  id: string
  reported_by: string
  latitude: number
  longitude: number
  status: 'pending' | 'fixed'
  before_image_url: string
  after_image_url: string | null
  created_at: string
  priority?: number
}

interface MapViewProps {
  onViewReport: (id: string) => void
}

// Client-side Haversine formula to compute distance in meters
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180
  const phi2 = lat2 * Math.PI / 180
  const deltaPhi = (lat2 - lat1) * Math.PI / 180
  const deltaLambda = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export const MapView: React.FC<MapViewProps> = ({ onViewReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.FeatureGroup | null>(null)
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null)
  
  const [reports, setReports] = useState<ReportItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  // Load all reports from backend
  const fetchReports = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ReportItem[] }>('/api/v1/reports')
      setReports(response.data)
    } catch (err: any) {
      console.error('Failed to load map reports:', err)
      setError(err.message || 'Could not fetch potholes for the map.')
    }
  }

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Create Leaflet map, default to Bangalore coordinates or fallback
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Position zoom control manually
      attributionControl: false // Minimalist stark UI
    }).setView([12.9716, 77.5946], 13)

    L.control.zoom({
      position: 'topright'
    }).addTo(map)

    // Standard OpenStreetMap tiles (rendered monochrome via CSS filters in index.css)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    const markersLayer = L.featureGroup().addTo(map)
    
    mapInstanceRef.current = map
    markersLayerRef.current = markersLayer

    fetchReports()

    // Automatically check for user geolocation on mount to set initial coordinates
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserCoords({ latitude, longitude })
      },
      (err) => {
        console.log('Initial geolocation ignored or denied:', err)
      },
      { timeout: 3000 }
    )

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      userLocationMarkerRef.current = null
    }
  }, [])

  // Plot markers when reports data changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer || reports.length === 0) return

    // Clear old markers
    layer.clearLayers()

    reports.forEach((report) => {
      if (report.status === 'fixed') return
      
      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: 9,
        fillColor: '#EF4444', // Rose red for pending
        color: '#ffffff', // Clean white border matching mockup
        weight: 2.5,
        fillOpacity: 1
      })

      // Popup Content Template (Stark Monochrome HTML)
      const popupDiv = document.createElement('div')
      popupDiv.style.fontFamily = 'Inter, sans-serif'
      popupDiv.style.width = '160px'
      
      popupDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
          <img src="${report.before_image_url}" style="width: 100%; height: 90px; object-fit: cover; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px;" />
        </div>
        <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">
          [ ${report.status.toUpperCase()} ] · PRIO: ${report.priority ?? 1}
        </div>
        <div style="font-size: 10px; color: #555555; margin-bottom: 8px;">
          LAT: ${report.latitude.toFixed(4)}<br/>LON: ${report.longitude.toFixed(4)}
        </div>
      `
      
      const viewBtn = document.createElement('button')
      viewBtn.className = 'btn btn-primary btn-small'
      viewBtn.innerText = 'VIEW DETAILS'
      viewBtn.style.width = '100%'
      viewBtn.style.fontSize = '8px'
      viewBtn.style.padding = '0.3rem'
      viewBtn.onclick = () => {
        onViewReport(report.id)
      }
      popupDiv.appendChild(viewBtn)

      marker.bindPopup(popupDiv, {
        closeButton: false,
        offset: L.point(0, -5)
      })
      
      layer.addLayer(marker)
    })

    // Fit map bounds to contain all markers if we have markers
    try {
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    } catch (e) {
      console.warn('Could not fit map bounds:', e)
    }

  }, [reports])

  // Geolocate User and Center Map
  const handleLocateUser = () => {
    const map = mapInstanceRef.current
    if (!map) return

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.setView([latitude, longitude], 15)
        setUserCoords({ latitude, longitude })
        
        // Remove previous location marker if it exists to prevent accumulation
        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.remove()
        }

        // Add a temporary self-location marker
        const myLocationMarker = L.circleMarker([latitude, longitude], {
          radius: 6,
          fillColor: '#0022FF',
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 1
        }).addTo(map)
        
        myLocationMarker.bindTooltip("You are here", { permanent: true, direction: 'top' })
        userLocationMarkerRef.current = myLocationMarker
        
        setLocating(false)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        alert('Could not retrieve your current location. Please verify GPS permissions.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      <div style={{ padding: '0 0 1rem 0' }}>
        <span className="text-muted-desc">Geospatial Grid</span>
        <h1 style={{ marginTop: '0.2rem' }}>Map</h1>
      </div>

      {error && (
        <div className="badge badge-outline" style={{ display: 'block', margin: '0 0 1rem 0', textAlign: 'center', padding: '0.6rem', color: '#000', borderColor: '#000' }}>
          ERROR: {error}
        </div>
      )}

      {/* Map Viewport Container */}
      <div style={{ flex: 1, position: 'relative', minHeight: '350px' }}>
        <div ref={mapContainerRef} className="map-wrapper" style={{ height: '100%', width: '100%', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', overflow: 'hidden' }} />
        
        {/* Float Locate Action Button */}
        <button
          onClick={handleLocateUser}
          disabled={locating}
          className="btn btn-primary btn-small"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            width: 'auto',
            height: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 1rem'
          }}
        >
          {locating ? (
            <div className="spinner" style={{ borderColor: '#000', borderTopColor: '#fff', width: '14px', height: '14px' }}></div>
          ) : (
            <>
              <Compass size={14} />
              <span style={{ fontSize: '9px', fontWeight: '800', marginLeft: '6px' }}>LOCATE ME</span>
            </>
          )}
        </button>
      </div>

      {/* Slide up panel for nearby reports matching mockup */}
      <div className="bottom-sheet">
        <div className="bottom-sheet-header">
          <span>{userCoords ? 'Potholes within 2km' : 'Total Pending Potholes'}</span>
          <span className="count-badge">
            {userCoords 
              ? reports.filter((r) => r.status === 'pending' && getHaversineDistance(userCoords.latitude, userCoords.longitude, r.latitude, r.longitude) <= 2000).length
              : reports.filter((r) => r.status === 'pending').length
            }
          </span>
        </div>
      </div>

    </div>
  )
}

import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { Camera, Edit2, Check, User } from 'lucide-react'

export const ProfileView: React.FC = () => {
  const { profile, refreshProfile } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Avatar upload states
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await api.patch('/api/v1/users/me', {
        full_name: fullName,
        phone: phone || null // Convert empty string to null for optional field
      })
      setSaveSuccess(true)
      await refreshProfile()
      setEditing(false)
    } catch (err: any) {
      setSaveError(err.message || 'Could not update profile information.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploading(true)
      setUploadError(null)

      try {
        const formData = new FormData()
        formData.append('image', file) // Backend router expects 'image'

        await api.postMultipart('/api/v1/users/me/avatar', formData)
        await refreshProfile()
      } catch (err: any) {
        setUploadError(err.message || 'Avatar upload failed.')
      } finally {
        setUploading(false)
      }
    }
  }

  const triggerAvatarInput = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click()
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="text-muted-desc">Personnel Records</span>
        <h1>User Profile</h1>
      </div>

      {/* Avatar Stark Picture Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div 
          style={{ position: 'relative', width: '100px', height: '100px', cursor: 'pointer', border: '2px solid #000000', backgroundColor: 'var(--bg-tertiary)' }}
          onClick={triggerAvatarInput}
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="User avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <User size={40} strokeWidth={1.5} />
            </div>
          )}

          {/* Camera overlay indicator */}
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '-4px', 
              right: '-4px', 
              backgroundColor: '#000000', 
              color: '#ffffff', 
              padding: '0.25rem',
              display: 'flex',
              border: '1.5px solid #ffffff'
            }}
          >
            {uploading ? (
              <div className="spinner" style={{ borderTopColor: '#fff', width: '10px', height: '10px' }}></div>
            ) : (
              <Camera size={12} />
            )}
          </div>
        </div>

        <input 
          type="file" 
          ref={avatarInputRef}
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
        
        {uploadError && (
          <span style={{ color: '#000', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: '700' }}>
            UPLOAD ERROR: {uploadError}
          </span>
        )}

        <h2 style={{ borderBottom: 'none', margin: '0.75rem 0 0 0', padding: '0', fontSize: '1.1rem' }}>
          {profile?.full_name || 'NO NAME CONFIGURED'}
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          ID: {profile?.id.substring(0, 18)}...
        </span>
      </div>

      {/* Account Info Details */}
      {!editing ? (
        <div className="card card-stark" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Email Endpoint</span>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{profile?.email}</div>
            </div>

            <div>
              <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Access Authorization Role</span>
              <div style={{ fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>{profile?.role}</div>
            </div>

            <div>
              <span className="text-muted-desc" style={{ fontSize: '0.6rem' }}>Contact Phone</span>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{profile?.phone || 'Not registered'}</div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: '0.5rem' }}
              onClick={() => {
                setFullName(profile?.full_name || '')
                setPhone(profile?.phone || '')
                setEditing(true)
                setSaveSuccess(false)
                setSaveError(null)
              }}
            >
              <Edit2 size={12} /> EDIT PROFILE DATA
            </button>
          </div>
        </div>
      ) : (
        <div className="card card-stark" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleProfileUpdate}>
            
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {saveError && (
              <div className="badge badge-outline" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', color: '#000', borderColor: '#000', marginBottom: '1.25rem', textTransform: 'none' }}>
                ERROR: {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                CANCEL
              </button>
              
              <button
                type="submit"
                className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
                disabled={saving}
              >
                {saving ? <div className="spinner" style={{ borderTopColor: '#fff', margin: '0 auto' }}></div> : 'SAVE CHANGES'}
              </button>
            </div>

          </form>
        </div>
      )}

      {saveSuccess && (
        <div className="badge badge-solid" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', marginTop: '1rem' }}>
          <Check size={12} style={{ marginRight: '4px' }} /> PROFILE UPDATED SUCCESSFULLY
        </div>
      )}

    </div>
  )
}

import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AuthViewProps {
  initialIsSignUp?: boolean
  initialShowInviteCode?: boolean
  onBackToLanding?: () => void
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialIsSignUp = false,
  initialShowInviteCode = false,
  onBackToLanding
}) => {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteCode, setShowInviteCode] = useState(initialShowInviteCode)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        // ── Step 1: Register via backend (validates invite code server-side) ──
        const registerRes = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            invite_code: showInviteCode ? inviteCode.trim() : '',
          }),
        })

        if (!registerRes.ok) {
          const errBody = await registerRes.json().catch(() => null)
          throw new Error(
            errBody?.detail || `Registration failed (${registerRes.status})`
          )
        }

        const registerData = await registerRes.json()

        // ── Step 2: Sign in immediately so the frontend gets a session ──
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // Account was created but auto-login failed (e.g. email verification required)
          setSuccessMsg(
            `Account created as ${registerData.role}. Please check your email to verify, then sign in.`
          )
          return
        }

        setSuccessMsg(`Account created as ${registerData.role} and logged in!`)
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        setSuccessMsg('Logged in successfully!')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  // Hover states handled inline for clean CSS-in-JS behavior
  const [backHovered, setBackHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const [inviteHovered, setInviteHovered] = useState(false)

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: '#fcfcfc',
      backgroundImage: 'radial-gradient(#e5e5e5 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
    }}>
      <div style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}>
        
        {/* Back to Home Button */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: backHovered ? '#000000' : '#737373',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              padding: '0',
              marginBottom: '2rem',
              alignSelf: 'flex-start',
              transition: 'all 0.2s ease',
              transform: backHovered ? 'translateX(-4px)' : 'translateX(0)',
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Back to Home
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 900,
            letterSpacing: '-0.04em', 
            marginBottom: '0.5rem',
            color: '#000000',
            border: 'none',
            padding: 0,
            textTransform: 'none'
          }}>
            spothole.
          </h1>
          <p style={{ color: '#737373', fontSize: '0.95rem' }}>
            {isSignUp ? 'Create an account to report issues' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                color: '#171717'
              }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1.1rem',
                  fontSize: '0.95rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#000000'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e5e5'
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              color: '#171717'
            }}>Email Address</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1.1rem',
                fontSize: '0.95rem',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#000000',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#000000'
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e5e5'
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              color: '#171717'
            }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.85rem 1.1rem',
                fontSize: '0.95rem',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#000000',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#000000'
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e5e5'
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '1.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowInviteCode(!showInviteCode)
                  if (showInviteCode) setInviteCode('')
                }}
                onMouseEnter={() => setInviteHovered(true)}
                onMouseLeave={() => setInviteHovered(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textDecoration: inviteHovered ? 'underline' : 'none',
                  padding: 0,
                  marginBottom: '0.75rem',
                  color: inviteHovered ? '#000000' : '#737373',
                  transition: 'color 0.2s ease',
                }}
              >
                {showInviteCode ? '✕ Citizen Signup instead' : 'Have an authority invite code?'}
              </button>

              {showInviteCode ? (
                <div style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.1rem',
                      fontSize: '0.95rem',
                      border: '1px solid #e5e5e5',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#000000'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e5e5'
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#737373', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    Authority accounts can review and resolve pothole reports.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#737373', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  You will be registered as a <strong>Citizen</strong> — submit new reports using image analysis.
                </p>
              )}
            </div>
          )}

          {errorMsg && (
            <div style={{ 
              backgroundColor: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '12px',
              color: '#c53030',
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: '1.4',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ 
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              color: '#15803d',
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: '1.4',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{ 
              width: '100%',
              padding: '1rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#737373' : (btnHovered ? '#1a1a1a' : '#000000'),
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transform: btnHovered && !loading ? 'translateY(-1px)' : 'translateY(0)',
              marginBottom: '1.5rem',
            }}
          >
            {loading ? <div className="spinner" style={{ borderTopColor: '#fff' }}></div> : (isSignUp ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#737373' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            style={{ 
              fontSize: '0.9rem', 
              fontWeight: '700', 
              color: '#000000',
              background: 'none', 
              border: 'none', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              padding: '0 2px'
            }}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
              setSuccessMsg(null)
              setShowInviteCode(false)
              setInviteCode('')
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

      </div>
    </div>
  )
}

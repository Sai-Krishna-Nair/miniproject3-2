import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

export const AuthView: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen')
  
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
        // Sign Up with email, password, and custom metadata options
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: fullName,
            },
          },
        })
        
        if (error) throw error

        // If session is returned, user is auto-logged in (local settings)
        if (data.session) {
          setSuccessMsg('Account created and logged in successfully!')
        } else {
          setSuccessMsg('Sign up successful! Please check your email inbox to verify.')
        }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', padding: '1rem' }}>
      <div className="card card-stark" style={{ padding: '2rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>SPOTHOLE</h1>
        </div>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Select Account Role</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-option ${role === 'citizen' ? 'active' : ''}`}
                  onClick={() => setRole('citizen')}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  className={`toggle-option ${role === 'authority' ? 'active' : ''}`}
                  onClick={() => setRole('authority')}
                >
                  Authority
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '-0.5rem', fontStyle: 'italic' }}>
                {role === 'citizen' 
                  ? 'Citizens submit new reports using image analysis.' 
                  : 'Authorities review and mark reported potholes as resolved.'}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="badge badge-outline" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', color: '#000', borderColor: '#000', marginBottom: '1.25rem', textTransform: 'none', fontWeight: '500' }}>
              ERROR: {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="badge badge-solid" style={{ display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem', marginBottom: '1.25rem', textTransform: 'none', fontWeight: '500' }}>
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
            style={{ marginBottom: '1rem' }}
          >
            {loading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : (isSignUp ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

      </div>
    </div>
  )
}

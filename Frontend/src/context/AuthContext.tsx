/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'citizen' | 'authority'
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  role: 'citizen' | 'authority' | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<'citizen' | 'authority' | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileAndRole = async (currentUser: User) => {
    try {
      // 1. Instantly set role based on local JWT metadata fallback
      const metaRole = currentUser.app_metadata?.role || currentUser.user_metadata?.role
      if (metaRole === 'citizen' || metaRole === 'authority') {
        setRole(metaRole as 'citizen' | 'authority')
      }

      // 2. Fetch full profile from backend to get name, phone, avatar, and confirmed role
      const fetchedProfile = await api.get<UserProfile>('/api/v1/users/me')
      setProfile(fetchedProfile)
      if (fetchedProfile.role) {
        setRole(fetchedProfile.role)
      }
    } catch (err) {
      console.error('Failed to sync profile from FastAPI backend:', err)
      // Keep metadata role if backend call fails
      const metaRole = currentUser.app_metadata?.role || currentUser.user_metadata?.role
      if (metaRole === 'citizen' || metaRole === 'authority') {
        setRole(metaRole as 'citizen' | 'authority')
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setRole(null)
      setProfile(null)
    } catch (err) {
      console.error('Error signing out:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check active session on mount
    const initAuth = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession()
        if (activeSession) {
          setSession(activeSession)
          setUser(activeSession.user)
          // Fetch profile in background, do not block the initial loading screen
          fetchProfileAndRole(activeSession.user)
        }
      } catch (err) {
        console.error('Error recovering session:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          // Fetch profile in background, do not block the transition
          fetchProfileAndRole(newSession.user)
        } else {
          setRole(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}

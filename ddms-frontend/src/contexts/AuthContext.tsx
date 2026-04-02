import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ddms.insurance.auth'

// Static credentials (single admin user). Change these later if you want.
const STATIC_USERNAME = 'admin'
const STATIC_PASSWORD = 'admin123'

type AuthState = {
  isAuthenticated: boolean
  username: string | null
}

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => { ok: true } | { ok: false; message: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { isAuthenticated: false, username: null }
    const parsed = JSON.parse(raw) as Partial<AuthState> | null
    if (!parsed || typeof parsed !== 'object') return { isAuthenticated: false, username: null }
    return {
      isAuthenticated: Boolean(parsed.isAuthenticated),
      username: typeof parsed.username === 'string' ? parsed.username : null,
    }
  } catch {
    return { isAuthenticated: false, username: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadAuthState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      login: (username, password) => {
        const u = username.trim()
        const p = password
        if (!u || !p) return { ok: false, message: 'Enter username and password.' }
        if (u !== STATIC_USERNAME || p !== STATIC_PASSWORD) {
          return { ok: false, message: 'Invalid username or password.' }
        }
        setState({ isAuthenticated: true, username: u })
        return { ok: true }
      },
      logout: () => setState({ isAuthenticated: false, username: null }),
    }
  }, [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, requestJson } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const current = await requestJson('/api/auth/me')
      setUser(current)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) setUser(null)
      else setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (email, password, selectedRole) => {
    setError('')
    const current = await requestJson('/api/auth/login', { method: 'POST', body: { email, password, selectedRole } })
    setUser(current)
    return current
  }, [])

  const logout = useCallback(async () => {
    setError('')
    await requestJson('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, error, login, logout, refresh }), [user, loading, error, login, logout, refresh])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }

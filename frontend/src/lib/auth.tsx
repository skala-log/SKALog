import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { get } from './api'
import type { Me } from './types'

const MeContext = createContext<Me | null>(null)

/** 로그인 여부를 확인하고, 안 됐으면 /login으로 보낸다. 로그인된 상태에서만 children을 렌더한다. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authed' | 'anon'>('loading')
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    get<Me>('/me')
      .then((res) => {
        setMe(res)
        setStatus('authed')
      })
      .catch(() => setStatus('anon'))
  }, [])

  if (status === 'loading') return null
  if (status === 'anon' || !me) return <Navigate to="/login" replace />
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>
}

export function useMe(): Me {
  const me = useContext(MeContext)
  if (!me) throw new Error('useMe must be used inside <AuthProvider>')
  return me
}

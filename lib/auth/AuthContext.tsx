'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAccount } from 'wagmi'

interface AuthState {
  /** サーバー側でセッション認証済みか */
  isAuthenticated: boolean
  /** セッションチェック中か */
  isChecking: boolean
  /** 認証済みウォレットアドレス */
  walletAddress: string | null
  /** 認証済みプロフィールID */
  profileId: string | null
  /** 認証状態を更新（サインイン成功後に呼ぶ） */
  setAuthenticated: (walletAddress: string, profileId?: string) => void
  /** 認証状態をリセット */
  clearAuth: () => void
  /** セッションを再チェック */
  recheckSession: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const checkSession = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await fetch('/api/auth/wallet/check', { method: 'GET' }).catch(() => null)
      if (res?.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setWalletAddress(data.wallet_address ?? null)
          setProfileId(data.profile_id ?? null)
          return
        }
      }
      setIsAuthenticated(false)
      setWalletAddress(null)
      setProfileId(null)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    if (isConnected) {
      checkSession()
    } else {
      setIsAuthenticated(false)
      setWalletAddress(null)
      setProfileId(null)
      setIsChecking(false)
    }
  }, [isConnected, address, checkSession])

  const setAuthenticated = useCallback((wallet: string, profile?: string) => {
    setIsAuthenticated(true)
    setWalletAddress(wallet)
    if (profile) setProfileId(profile)
  }, [])

  const clearAuth = useCallback(() => {
    setIsAuthenticated(false)
    setWalletAddress(null)
    setProfileId(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isChecking,
        walletAddress,
        profileId,
        setAuthenticated,
        clearAuth,
        recheckSession: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

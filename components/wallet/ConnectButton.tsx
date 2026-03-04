'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage } from 'wagmi'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/AuthContext'

interface ConnectButtonProps {
  onAuthenticated?: (walletAddress: string) => void
}

export function ConnectButton({ onAuthenticated }: ConnectButtonProps) {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { isAuthenticated, isChecking, setAuthenticated } = useAuth()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleSignIn = async () => {
    if (!address) return

    setIsAuthenticating(true)
    try {
      const timestamp = Date.now()
      const message = `Welcome to TradingCup!\n\nPlease sign this message to verify your wallet ownership.\n\nWallet: ${address}\nTimestamp: ${timestamp}`

      const signature = await signMessageAsync({ message })

      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, message, signature }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? '認証に失敗しました')
      }

      const data = await res.json()
      setAuthenticated(address, data.profile_id)
      toast.success('サインインしました')
      onAuthenticated?.(address)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'サインインに失敗しました'
      toast.error(message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        if (!mounted) return null

        if (!account) {
          return (
            <Button onClick={openConnectModal} className="bg-primary text-primary-foreground">
              ウォレット接続
            </Button>
          )
        }

        if (chain?.unsupported) {
          return (
            <Button onClick={openChainModal} variant="destructive">
              ネットワークを変更
            </Button>
          )
        }

        if (isChecking) {
          return (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )
        }

        if (!isAuthenticated) {
          return (
            <Button onClick={handleSignIn} disabled={isAuthenticating}>
              {isAuthenticating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 署名中...</>
              ) : (
                'サインイン'
              )}
            </Button>
          )
        }

        return (
          <Button onClick={openAccountModal} variant="outline" className="font-mono text-sm">
            {account.displayName}
          </Button>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}

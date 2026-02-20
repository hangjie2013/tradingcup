'use client'

import { ConnectButton } from '@/components/wallet/ConnectButton'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Wallet, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full border border-primary/30 bg-primary/10 p-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">TradingCup</h1>
          <p className="text-muted-foreground">Sign in with your Ethereum wallet to participate</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              No email or password required. Your wallet is your identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ConnectButton
                onAuthenticated={() => router.push('/')}
              />
            </div>

            <div className="space-y-3 pt-2">
              {[
                { icon: Wallet, text: 'Connect with MetaMask, WalletConnect, or any EVM wallet' },
                { icon: Shield, text: 'Sign a message to verify ownership — no funds needed' },
                { icon: Zap, text: 'Instant access to all trading competitions' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By connecting, you agree to our terms of service.{' '}
          <Link href="/" className="text-primary hover:underline">
            Back to lobby
          </Link>
        </p>
      </div>
    </div>
  )
}

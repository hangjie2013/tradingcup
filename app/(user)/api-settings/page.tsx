'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, ArrowLeft, ExternalLink, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ApiSettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    uid?: string
    usdt_balance?: number
    errorMessage?: string
  } | null>(null)
  const [currentStatus, setCurrentStatus] = useState<{ connected: boolean; saved_at: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/lbank/status')
      .then((r) => r.json())
      .then((d) => setCurrentStatus(d))
      .catch(() => setCurrentStatus({ connected: false, saved_at: null }))
  }, [])

  const handleTest = async () => {
    if (!apiKey || !apiSecret) {
      toast.error('APIキーとシークレットを入力してください')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/lbank/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? '接続に失敗しました')

      setTestResult({ success: true, ...data.data })
      toast.success('API接続に成功しました！')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '接続に失敗しました'
      setTestResult({ success: false, errorMessage: msg })
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!testResult?.success) {
      toast.error('先にAPIキーのテストを行ってください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/lbank/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? '保存に失敗しました')

      toast.success('APIキーを安全に保存しました！')
      setApiKey('')
      setApiSecret('')
      setTestResult(null)
      setCurrentStatus({ connected: true, saved_at: new Date().toISOString() })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
            <ArrowLeft className="h-4 w-4" />
            ロビーに戻る
          </Link>
          <h1 className="text-2xl font-bold">LBank API設定</h1>
          <p className="text-muted-foreground mt-1">大会に参加するにはLBankアカウントを接続してください</p>
        </div>

        <div className="space-y-4">
          {/* 現在の接続状態 */}
          {currentStatus && (
            <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
              currentStatus.connected
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-zinc-600/40 bg-zinc-800/40'
            }`}>
              {currentStatus.connected ? (
                <Wifi className="h-5 w-5 text-green-400 shrink-0" />
              ) : (
                <WifiOff className="h-5 w-5 text-zinc-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${currentStatus.connected ? 'text-green-400' : 'text-zinc-400'}`}>
                  {currentStatus.connected ? 'LBank 接続済み' : 'LBank 未接続'}
                </p>
                {currentStatus.connected && currentStatus.saved_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    登録日時: {new Date(currentStatus.saved_at).toLocaleDateString('ja-JP')}
                  </p>
                )}
                {!currentStatus.connected && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    APIキーを登録して大会に参加できるようにしてください
                  </p>
                )}
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>APIキーの取得方法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>LBankにログイン</li>
                <li>アカウント → API管理 に移動</li>
                <li><strong className="text-foreground">読み取り専用</strong>権限で新しいAPIキーを作成</li>
                <li>APIキーとシークレットキーをコピー</li>
              </ol>
              <a
                href="https://www.lbank.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                LBankを開く <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>APIキーを入力</CardTitle>
              <CardDescription>
                キーはAES-256-GCMで暗号化して保存されます。
                残高と取引履歴の取得に読み取り専用アクセスのみ使用します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">APIキー</Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="LBank APIキー"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-secret">APIシークレット</Label>
                <div className="relative">
                  <Input
                    id="api-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="LBank APIシークレット"
                    className="font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
                  testResult.success
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {testResult.success ? (
                      <>
                        <p className="font-medium">接続成功！</p>
                        {testResult.uid && <p className="text-xs opacity-80">UID: {testResult.uid}</p>}
                        {testResult.usdt_balance !== undefined && (
                          <p className="text-xs opacity-80">USDT残高: ${testResult.usdt_balance.toFixed(2)}</p>
                        )}
                      </>
                    ) : (
                      <p>{testResult?.errorMessage ?? '接続に失敗しました。認証情報を確認してください。'}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !apiKey || !apiSecret}
                  className="flex-1"
                >
                  {testing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> テスト中...</>
                  ) : (
                    '接続テスト'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !testResult?.success}
                  className="flex-1"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 保存中...</>
                  ) : (
                    'キーを保存'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm text-yellow-400">
                <span className="text-yellow-500 mt-0.5">⚠</span>
                <p>
                  <strong>読み取り専用</strong>のAPIキーのみ使用してください。TradingCupは出金権限を要求せず、資金を移動することはできません。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

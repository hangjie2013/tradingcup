'use client'

import { useEffect, useState } from 'react'

export function LbankStatusBadge() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/lbank/status')
      .then((r) => r.json())
      .then((d) => setConnected(d.connected))
      .catch(() => setConnected(false))
  }, [])

  if (connected === null) return <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        connected ? 'bg-green-400' : 'bg-zinc-500'
      }`}
      title={connected ? 'LBank 接続済み' : 'LBank 未接続'}
    />
  )
}

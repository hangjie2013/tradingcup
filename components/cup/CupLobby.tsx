'use client'

import { useEffect, useState } from 'react'
import { Cup } from '@/types'
import { CupCard } from './CupCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

export function CupLobby() {
  const [cups, setCups] = useState<(Cup & { participant_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('active')

  useEffect(() => {
    const fetchCups = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/cups')
        if (!res.ok) throw new Error('Failed to fetch')
        const { data } = await res.json()
        setCups(data ?? [])
      } catch {
        setCups([])
      } finally {
        setLoading(false)
      }
    }

    fetchCups()
  }, [])

  const filterCups = (status: string) => {
    if (status === 'active') return cups.filter((c) => c.status === 'active')
    if (status === 'upcoming') return cups.filter((c) => c.status === 'scheduled')
    if (status === 'ended') return cups.filter((c) => ['ended', 'finalized'].includes(c.status))
    return cups
  }

  const filtered = filterCups(activeTab)

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-[#1d2766] rounded-xl">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[rgba(29,39,102,0.5)] data-[state=active]:border-[#1d2766] data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            開催中 ({cups.filter((c) => c.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-[rgba(29,39,102,0.5)] data-[state=active]:border-[#1d2766] data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            予定 ({cups.filter((c) => c.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger
            value="ended"
            className="data-[state=active]:bg-[rgba(29,39,102,0.5)] data-[state=active]:border-[#1d2766] data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            完了 ({cups.filter((c) => ['ended', 'finalized'].includes(c.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>現在該当するカップはありません。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cup) => (
                <CupCard key={cup.id} cup={cup} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

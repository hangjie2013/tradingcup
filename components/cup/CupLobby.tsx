'use client'

import { useEffect, useState } from 'react'
import { Cup } from '@/types'
import { CupCard } from './CupCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

export function CupLobby() {
  const [cups, setCups] = useState<(Cup & { participant_count?: number })[]>([])
  const [registeredCupIds, setRegisteredCupIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('active')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [cupsRes, partRes] = await Promise.all([
          fetch('/api/cups'),
          fetch('/api/me/participations'),
        ])
        if (!cupsRes.ok) throw new Error('Failed to fetch')
        const { data } = await cupsRes.json()
        setCups(data ?? [])

        if (partRes.ok) {
          const { data: cupIds } = await partRes.json()
          setRegisteredCupIds(new Set(cupIds ?? []))
        }
      } catch {
        setCups([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filterCups = (status: string) => {
    if (status === 'active') return cups.filter((c) => c.status === 'active')
    if (status === 'upcoming') return cups.filter((c) => c.status === 'scheduled')
    if (status === 'ended') return cups.filter((c) => ['ended', 'finalized'].includes(c.status))
    return cups
  }

  const filtered = filterCups(activeTab)

  return (
    <div className="space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-card rounded-xl h-12">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-secondary/50 data-[state=active]:border-border data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            開催中 ({cups.filter((c) => c.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-secondary/50 data-[state=active]:border-border data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            参加受付中 ({cups.filter((c) => c.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger
            value="ended"
            className="data-[state=active]:bg-secondary/50 data-[state=active]:border-border data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
          >
            開催終了 ({cups.filter((c) => ['ended', 'finalized'].includes(c.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>現在該当するカップはありません。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((cup) => (
                <CupCard key={cup.id} cup={cup} isRegistered={registeredCupIds.has(cup.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

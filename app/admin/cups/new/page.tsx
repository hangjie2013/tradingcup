'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CupForm } from '@/components/admin/CupForm'
import { Cup } from '@/types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

function NewCupContent() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [cup, setCup] = useState<Partial<Cup> | undefined>(undefined)
  const [loading, setLoading] = useState(!!editId)

  useEffect(() => {
    if (!editId) return

    fetch(`/api/cups/${editId}`)
      .then((r) => r.json())
      .then(({ data }) => setCup(data))
      .catch(() => setCup(undefined))
      .finally(() => setLoading(false))
  }, [editId])

  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">
        {editId ? '大会を編集' : '新しい大会を作成'}
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <CupForm mode={editId ? 'edit' : 'create'} cup={cup} />
      )}
    </main>
  )
}

export default function NewCupPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link
            href="/admin/cups"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            大会一覧に戻る
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <NewCupContent />
      </Suspense>
    </div>
  )
}

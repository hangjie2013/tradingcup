import { CupForm } from '@/components/admin/CupForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-6">新しい大会を作成</h1>
        <CupForm mode="create" />
      </main>
    </div>
  )
}

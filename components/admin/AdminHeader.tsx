'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Trophy, Image, User } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/admin/cups', label: 'カップ戦', icon: Trophy },
  { href: '/admin/banners', label: 'バナー', icon: Image },
]

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center px-4 gap-6">
        <Link href="/admin/cups" className="font-bold text-sm shrink-0">
          TradingCup 管理
        </Link>
        <nav className="flex items-stretch h-full">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'text-foreground border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-stretch h-full items-center gap-1">
          <Link
            href="/admin/account"
            className={`flex items-center gap-1.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              pathname.startsWith('/admin/account')
                ? 'text-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
            }`}
          >
            <User className="h-4 w-4" />
            アカウント
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}

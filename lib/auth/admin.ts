import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin認可ヘルパー（環境変数メールホワイトリスト方式）
 *
 * Phase 0: ADMIN_EMAILS 環境変数でメールアドレスを許可リスト管理
 * Admin認証はSupabase Auth（メール/パスワード）を使用
 * 将来: DB roleカラム方式に移行予定
 */

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

type AdminCheckResult =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; response: NextResponse }

/**
 * Admin APIルートで使用する認可チェック
 * Supabase Authセッションを検証し、メールがホワイトリストに含まれるか確認
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const adminEmails = getAdminEmails()

  if (adminEmails.length === 0) {
    console.error('ADMIN_EMAILS is not configured')
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Admin access not configured' }, { status: 503 }),
    }
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { authorized: true, userId: user.id, email: user.email }
}

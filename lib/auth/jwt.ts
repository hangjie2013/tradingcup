/**
 * JWT署名/検証用の秘密鍵を返す
 *
 * JWT_SIGNING_SECRET を優先使用し、未設定の場合は SUPABASE_SERVICE_ROLE_KEY にフォールバック
 * （後方互換性のため。本番では JWT_SIGNING_SECRET の設定を必須とする）
 *
 * 起動時に両方未設定の場合は明確なエラーを出す
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error(
      'JWT_SIGNING_SECRET (or SUPABASE_SERVICE_ROLE_KEY as fallback) must be set'
    )
  }

  if (!process.env.JWT_SIGNING_SECRET && process.env.NODE_ENV === 'production') {
    console.warn(
      '[SECURITY] JWT_SIGNING_SECRET is not set. Falling back to SUPABASE_SERVICE_ROLE_KEY. ' +
        'Set JWT_SIGNING_SECRET to a dedicated secret for production.'
    )
  }

  return new TextEncoder().encode(secret)
}

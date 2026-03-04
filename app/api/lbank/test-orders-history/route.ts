import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/crypto/encryption'
import { exchangeApiKeyRepository } from '@/lib/repositories/exchange-api-key'
import { createHash, createHmac } from 'crypto'

const LBANK_BASE_URL = 'https://api.lbkex.com'

/**
 * dev 専用: orders_info_history.do で IZKY/USDT の注文履歴が取れるかテスト
 *
 * GET /api/lbank/test-orders-history?user_id=<profile_id>
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 405 })
  }

  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const apiKeyRecord = await exchangeApiKeyRepository.findByUser(userId, 'lbank')
  if (!apiKeyRecord) {
    return NextResponse.json({ error: 'No API key found for user' }, { status: 404 })
  }

  const apiKey = decrypt(apiKeyRecord.encrypted_api_key)
  const secretKey = decrypt(apiKeyRecord.encrypted_api_secret)

  const results: Record<string, unknown> = {}

  // 1. transaction_history.do（現在使用中 — エラーになるはず）
  try {
    const data = await lbankPost('/v2/supplement/transaction_history.do', {
      symbol: 'izky_usdt',
      limit: '10',
    }, apiKey, secretKey)
    results.transaction_history = { success: true, data }
  } catch (e) {
    results.transaction_history = { success: false, error: e instanceof Error ? e.message : String(e) }
  }

  // 2. orders_info_history.do（代替候補）
  try {
    const data = await lbankPost('/v2/spot/trade/orders_info_history.do', {
      symbol: 'izky_usdt',
      current_page: '1',
      page_length: '10',
    }, apiKey, secretKey)
    results.orders_info_history = { success: true, data }
  } catch (e) {
    results.orders_info_history = { success: false, error: e instanceof Error ? e.message : String(e) }
  }

  // 3. order_transaction_detail.do は orderId が必要なのでスキップ

  return NextResponse.json(results)
}

// ── LBank 署名・リクエスト（api.ts の内部関数を再利用できないためローカルコピー） ──

function md5Uppercase(str: string): string {
  return createHash('md5').update(str).digest('hex').toUpperCase()
}

function buildSignature(params: Record<string, string>, secretKey: string): string {
  const sortedKeys = Object.keys(params).sort()
  const sorted = sortedKeys.map((k) => `${k}=${params[k]}`).join('&')
  const md5Hash = md5Uppercase(sorted)
  return createHmac('sha256', secretKey).update(md5Hash).digest('hex')
}

async function lbankPost(endpoint: string, params: Record<string, string>, apiKey: string, secretKey: string): Promise<unknown> {
  const timestamp = Date.now().toString()
  const echostr = Array.from({ length: 35 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('')

  const allParams: Record<string, string> = {
    api_key: apiKey,
    signature_method: 'HmacSHA256',
    timestamp,
    echostr,
    ...params,
  }

  const signature = buildSignature(allParams, secretKey)
  allParams['sign'] = signature

  const body = new URLSearchParams(allParams)
  const res = await fetch(`${LBANK_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      echostr,
      timestamp,
      signature_method: 'HmacSHA256',
    },
    body: body.toString(),
  })

  const json = await res.json()
  if (json.result !== 'true' && json.result !== 'True' && json.result !== true) {
    throw new Error(`LBank error ${json.error_code}: ${json.msg ?? JSON.stringify(json)}`)
  }
  return json.data
}

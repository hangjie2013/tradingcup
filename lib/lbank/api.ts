import { createHash, createHmac } from 'crypto'

const LBANK_BASE_URL = 'https://api.lbkex.com'

interface LBankRequestParams {
  [key: string]: string | number
}

interface LBankResponse<T = unknown> {
  result: string | boolean
  data?: T
  error_code?: number
  msg?: string
}

function md5Uppercase(str: string): string {
  return createHash('md5').update(str).digest('hex').toUpperCase()
}

function buildSignature(params: Record<string, string>, secretKey: string): string {
  // Sort params alphabetically
  const sortedKeys = Object.keys(params).sort()
  const sorted = sortedKeys.map((k) => `${k}=${params[k]}`).join('&')

  // MD5 hash -> uppercase hex
  const md5Hash = md5Uppercase(sorted)

  // HmacSHA256 with secretKey -> HEX (LBank requires hex, not base64)
  const signature = createHmac('sha256', secretKey)
    .update(md5Hash)
    .digest('hex')

  return signature
}

function buildLBankRequest(
  params: LBankRequestParams,
  apiKey: string,
  secretKey: string
): { body: URLSearchParams; headers: Record<string, string> } {
  const timestamp = Date.now().toString()
  // LBank requires echostr: 30-40 chars, alphanumeric only
  const echostr = Array.from({ length: 35 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('')

  const baseParams: Record<string, string> = {
    api_key: apiKey,
    signature_method: 'HmacSHA256',
    timestamp,
    echostr,
  }

  // Merge with provided params
  const allParams: Record<string, string> = { ...baseParams }
  for (const [k, v] of Object.entries(params)) {
    allParams[k] = String(v)
  }

  const signature = buildSignature(allParams, secretKey)
  allParams['sign'] = signature

  const body = new URLSearchParams(allParams)

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    echostr,
    timestamp,
    signature_method: 'HmacSHA256',
  }

  return { body, headers }
}

async function lbankPost<T>(
  endpoint: string,
  params: LBankRequestParams,
  apiKey: string,
  secretKey: string
): Promise<T> {
  const { body, headers } = buildLBankRequest(params, apiKey, secretKey)

  const res = await fetch(`${LBANK_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error(`LBank API error: ${res.status} ${res.statusText}`)
  }

  const json: LBankResponse<T> = await res.json()

  if (json.result !== 'true' && json.result !== 'True' && json.result !== true) {
    throw new Error(`LBank error ${json.error_code}: ${json.msg ?? 'unknown error'}`)
  }

  return json.data as T
}

// Get account balance
export async function getAccountBalance(
  apiKey: string,
  secretKey: string
): Promise<{ asset: string; available: string; freeze: string }[]> {
  const data = await lbankPost<{
    info: { free: Record<string, string>; freeze: Record<string, string> }
  }>('/v2/supplement/user_info_account.do', {}, apiKey, secretKey)

  const free = data.info?.free ?? {}
  const freeze = data.info?.freeze ?? {}

  return Object.keys(free).map((asset) => ({
    asset,
    available: free[asset] ?? '0',
    freeze: freeze[asset] ?? '0',
  }))
}

// Get USDT balance specifically
export async function getUSDTBalance(
  apiKey: string,
  secretKey: string
): Promise<number> {
  const balances = await getAccountBalance(apiKey, secretKey)
  const usdt = balances.find((b) => b.asset.toLowerCase() === 'usdt')
  if (!usdt) return 0
  return parseFloat(usdt.available) + parseFloat(usdt.freeze)
}

// Get transaction history for a symbol
export async function getTransactionHistory(
  apiKey: string,
  secretKey: string,
  symbol: string = 'izky_usdt',
  startTime?: number,
  endTime?: number,
  limit: number = 100
): Promise<{
  orderId: string
  symbol: string
  side: string
  price: string
  volume: string
  dealVolume: string
  dealPrice: string
  transactTime: string
}[]> {
  const params: LBankRequestParams = {
    symbol,
    current_page: 1,
    page_length: limit,
  }
  if (startTime) params['start_date'] = startTime
  if (endTime) params['end_date'] = endTime

  const data = await lbankPost<{ orders: unknown[] }>(
    '/v2/supplement/transaction_history.do',
    params,
    apiKey,
    secretKey
  )

  return (data?.orders ?? []) as ReturnType<typeof getTransactionHistory> extends Promise<infer R> ? R : never
}

// Get user info (for validation)
export async function getUserInfo(
  apiKey: string,
  secretKey: string
): Promise<{ uid: string }> {
  return lbankPost<{ uid: string }>(
    '/v2/supplement/user_info.do',
    {},
    apiKey,
    secretKey
  )
}

// Calculate total volume for IZKY/USDT since a given time
export async function getVolumeForPair(
  apiKey: string,
  secretKey: string,
  startTimestamp: number
): Promise<number> {
  const trades = await getTransactionHistory(
    apiKey,
    secretKey,
    'izky_usdt',
    startTimestamp,
    undefined,
    100
  )

  let totalVolume = 0
  for (const trade of trades) {
    // Volume in USDT = dealVolume * dealPrice (or use dealVolume directly if it's USDT side)
    const vol = parseFloat(trade.dealVolume) * parseFloat(trade.dealPrice)
    if (!isNaN(vol)) totalVolume += vol
  }

  return totalVolume
}

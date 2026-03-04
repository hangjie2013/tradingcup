import { createHash, createHmac } from 'crypto'

const MOCK_MODE = process.env.LBANK_MOCK_MODE === 'true'
const LBANK_BASE_URL = 'https://api.lbkex.com'

// モックモジュールは MOCK_MODE=true 時のみ動的にロードする（本番でimportされることを防ぐ）
async function getMock() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: LBank mock mode must not be used in production')
  }
  return import('./mock')
}

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

// Get raw account balance response (for debugging)
export async function getAccountBalanceRaw(
  apiKey: string,
  secretKey: string
): Promise<unknown> {
  if (MOCK_MODE) return (await getMock()).mockGetAccountBalanceRaw(apiKey, secretKey)
  return lbankPost<unknown>(
    '/v2/supplement/user_info_account.do', {}, apiKey, secretKey
  )
}

// Get account balance
export async function getAccountBalance(
  apiKey: string,
  secretKey: string
): Promise<{ asset: string; available: string; freeze: string }[]> {
  if (MOCK_MODE) return (await getMock()).mockGetAccountBalance(apiKey, secretKey)
  const data = await getAccountBalanceRaw(apiKey, secretKey)

  // LBank v2 実レスポンス形式:
  // { uid: "...", balances: [ { asset: "usdt", free: "15", locked: "0" }, ... ] }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    // balances 配列形式（実環境で確認済み）
    if (Array.isArray(obj.balances)) {
      return (obj.balances as Record<string, string>[]).map((item) => ({
        asset: item.asset ?? item.coin ?? '',
        available: item.free ?? '0',
        freeze: item.locked ?? item.freeze ?? '0',
      }))
    }
  }

  // トップレベルが配列の場合
  if (Array.isArray(data)) {
    return (data as Record<string, string>[]).map((item) => ({
      asset: item.asset ?? item.coin ?? '',
      available: item.free ?? '0',
      freeze: item.locked ?? item.freeze ?? '0',
    }))
  }

  console.error('Unexpected getAccountBalance response structure:', JSON.stringify(data))
  return []
}

// Get USDT balance specifically
export async function getUSDTBalance(
  apiKey: string,
  secretKey: string
): Promise<number> {
  if (MOCK_MODE) return (await getMock()).mockGetUSDTBalance(apiKey, secretKey)
  const balances = await getAccountBalance(apiKey, secretKey)
  const usdt = balances.find((b) => b.asset.toLowerCase() === 'usdt')
  if (!usdt) return 0
  return parseFloat(usdt.available) + parseFloat(usdt.freeze)
}

// Get raw transaction history response (for debugging)
export async function getTransactionHistoryRaw(
  apiKey: string,
  secretKey: string,
  symbol: string = 'izky_usdt',
  startTime?: number,
  limit: number = 10
): Promise<unknown> {
  if (MOCK_MODE) return (await getMock()).mockGetTransactionHistoryRaw(apiKey, secretKey, symbol, startTime, limit)
  const params: LBankRequestParams = {
    symbol,
    current_page: 1,
    page_length: limit,
  }
  if (startTime) params['start_date'] = startTime

  return lbankPost<unknown>(
    '/v2/supplement/transaction_history.do',
    params,
    apiKey,
    secretKey
  )
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
  if (MOCK_MODE) return (await getMock()).mockGetTransactionHistory(apiKey, secretKey, symbol, startTime, endTime, limit)
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
  if (MOCK_MODE) return (await getMock()).mockGetUserInfo(apiKey, secretKey)
  return lbankPost<{ uid: string }>(
    '/v2/supplement/user_info.do',
    {},
    apiKey,
    secretKey
  )
}

// Get deposit history (CLAUDE.md 3.2② 入出金で失格)
export async function getDepositHistory(
  apiKey: string,
  secretKey: string,
  startTime: number,
  endTime: number
): Promise<{ id: string; amount: string; coin: string; status: string; timestamp: number }[]> {
  if (MOCK_MODE) return (await getMock()).mockGetDepositHistory(apiKey, secretKey, startTime, endTime)
  const params: LBankRequestParams = {
    status: '2', // "2" = success
    startTime,
    endTime,
  }

  const data = await lbankPost<{
    list: { id: string; amount: string; coin: string; status: string; insertTime: number }[]
  }>('/v2/spot/wallet/deposit_history.do', params, apiKey, secretKey)

  return (data?.list ?? []).map((d) => ({
    id: d.id,
    amount: d.amount,
    coin: d.coin,
    status: d.status,
    timestamp: d.insertTime,
  }))
}

// Get withdrawal history (CLAUDE.md 3.2② 入出金で失格)
export async function getWithdrawalHistory(
  apiKey: string,
  secretKey: string,
  startTime: number,
  endTime: number
): Promise<{ id: string; amount: string; coin: string; status: string; timestamp: number }[]> {
  if (MOCK_MODE) return (await getMock()).mockGetWithdrawalHistory(apiKey, secretKey, startTime, endTime)
  const params: LBankRequestParams = {
    status: '4', // "4" = completed
    startTime,
    endTime,
  }

  const data = await lbankPost<{
    list: { id: string; amount: string; coin: string; status: string; createTime: number }[]
  }>('/v2/spot/wallet/withdraws.do', params, apiKey, secretKey)

  return (data?.list ?? []).map((w) => ({
    id: w.id,
    amount: w.amount,
    coin: w.coin,
    status: w.status,
    timestamp: w.createTime,
  }))
}

// Get current IZKY/USDT price from public ticker API (no auth required)
export async function getIZKYPrice(): Promise<number> {
  if (MOCK_MODE) return (await getMock()).mockGetIZKYPrice()
  const res = await fetch(`${LBANK_BASE_URL}/v2/ticker/24hr.do?symbol=izky_usdt`)
  if (!res.ok) throw new Error(`LBank ticker API error: ${res.status}`)
  const json = await res.json()
  const price = parseFloat(json?.data?.[0]?.ticker?.latest ?? '0')
  if (price <= 0) throw new Error('Failed to get valid IZKY price')
  return price
}

// Get total balance in USDT (USDT + IZKY × current price)
// CLAUDE.md: 総資産 = USDT残高 + IZKY残高 × 時点価格
export async function getTotalBalanceUSDT(
  apiKey: string,
  secretKey: string
): Promise<{ totalUSDT: number; izkyPrice: number }> {
  if (MOCK_MODE) return (await getMock()).mockGetTotalBalanceUSDT(apiKey, secretKey)
  const [balances, izkyPrice] = await Promise.all([
    getAccountBalance(apiKey, secretKey),
    getIZKYPrice(),
  ])
  const usdt = balances.find((b) => b.asset.toLowerCase() === 'usdt')
  const izky = balances.find((b) => b.asset.toLowerCase() === 'izky')
  const usdtTotal = parseFloat(usdt?.available ?? '0') + parseFloat(usdt?.freeze ?? '0')
  const izkyTotal = parseFloat(izky?.available ?? '0') + parseFloat(izky?.freeze ?? '0')
  return {
    totalUSDT: usdtTotal + izkyTotal * izkyPrice,
    izkyPrice,
  }
}

// Calculate total volume for IZKY/USDT since a given time
export async function getVolumeForPair(
  apiKey: string,
  secretKey: string,
  startTimestamp: number
): Promise<number> {
  if (MOCK_MODE) return (await getMock()).mockGetVolumeForPair(apiKey, secretKey, startTimestamp)
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

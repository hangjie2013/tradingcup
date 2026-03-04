/**
 * LBank API モックモジュール
 *
 * 環境変数:
 *   LBANK_MOCK_MODE=true     — モック有効化
 *   LBANK_MOCK_SCENARIO=...  — シナリオ選択（default: normal）
 *
 * シナリオ一覧:
 *   normal                  — PNL計算・ランキング正常系
 *   disqualified_deposit    — 入金あり → 失格判定
 *   disqualified_withdrawal — 出金あり → 失格判定
 *   ineligible              — 出来高不足（不適格）
 *   low_balance             — 最低残高未満（参加登録拒否）
 *
 * PNLテストシナリオ:
 *   pnl_price_change_only     — 価格変動のみ（取引なし）
 *   pnl_trade_and_price       — 取引 + 価格変動（標準）
 *   pnl_unrealized_position   — 未決済ポジション評価（最重要）
 *   pnl_all_izky              — 全額 IZKY 保有
 *   pnl_price_drop            — 価格下落 + 出来高不足
 */

// ── 型定義 ──────────────────────────────────────

type Scenario =
  | 'normal'
  | 'disqualified_deposit'
  | 'disqualified_withdrawal'
  | 'ineligible'
  | 'low_balance'
  | 'pnl_price_change_only'
  | 'pnl_trade_and_price'
  | 'pnl_unrealized_position'
  | 'pnl_all_izky'
  | 'pnl_price_drop'

interface BalanceSnapshot {
  usdtAvailable: string
  usdtFreeze: string
  izkyAvailable: string
  izkyFreeze: string
  izkyPrice: number
}

interface ScenarioData {
  start: BalanceSnapshot   // 大会開始時（初回バッチ）に返す値
  end: BalanceSnapshot     // 以降のバッチで返す値
  trades: {
    orderId: string
    symbol: string
    side: string
    price: string
    volume: string
    dealVolume: string
    dealPrice: string
    transactTime: string
  }[]
  deposits: {
    id: string
    amount: string
    coin: string
    status: string
    timestamp: number
  }[]
  withdrawals: {
    id: string
    amount: string
    coin: string
    status: string
    timestamp: number
  }[]
}

// ── フェーズ管理 ─────────────────────────────────

let currentPhase: 'start' | 'end' = 'start'

export function setMockPhase(phase: 'start' | 'end'): void {
  currentPhase = phase
}

export function resetMockPhase(): void {
  currentPhase = 'start'
}

export function getMockPhase(): 'start' | 'end' {
  return currentPhase
}

// ── シナリオデータ ──────────────────────────────

const now = Date.now()

/** start/end が同じ値の BalanceSnapshot を返すヘルパー（PNL検証不要なシナリオ用） */
function sameSnapshot(s: Omit<BalanceSnapshot, 'izkyPrice'> & { izkyPrice?: number }): { start: BalanceSnapshot; end: BalanceSnapshot } {
  const snapshot: BalanceSnapshot = { ...s, izkyPrice: s.izkyPrice ?? 0.0012 }
  return { start: snapshot, end: snapshot }
}

const SCENARIOS: Record<Scenario, ScenarioData> = {
  // ── 既存シナリオ（start = end、PNL検証が目的ではない） ──

  normal: {
    ...sameSnapshot({ usdtAvailable: '92', usdtFreeze: '0', izkyAvailable: '20000', izkyFreeze: '0', izkyPrice: 0.0012 }),
    trades: [
      {
        orderId: 'mock-order-001', symbol: 'izky_usdt', side: 'buy',
        price: '0.0012', volume: '50000', dealVolume: '50000', dealPrice: '0.0012',
        transactTime: String(now - 3600_000),
      },
      {
        orderId: 'mock-order-002', symbol: 'izky_usdt', side: 'sell',
        price: '0.0013', volume: '40000', dealVolume: '40000', dealPrice: '0.0013',
        transactTime: String(now - 1800_000),
      },
    ],
    deposits: [],
    withdrawals: [],
  },

  disqualified_deposit: {
    ...sameSnapshot({ usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '10000', izkyFreeze: '0' }),
    trades: [
      {
        orderId: 'mock-order-001', symbol: 'izky_usdt', side: 'buy',
        price: '0.0012', volume: '50000', dealVolume: '50000', dealPrice: '0.0012',
        transactTime: String(now - 3600_000),
      },
      {
        orderId: 'mock-order-002', symbol: 'izky_usdt', side: 'sell',
        price: '0.0013', volume: '40000', dealVolume: '40000', dealPrice: '0.0013',
        transactTime: String(now - 1800_000),
      },
    ],
    deposits: [
      { id: 'mock-deposit-001', amount: '500', coin: 'usdt', status: '2', timestamp: now - 7200_000 },
    ],
    withdrawals: [],
  },

  disqualified_withdrawal: {
    ...sameSnapshot({ usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '10000', izkyFreeze: '0' }),
    trades: [
      {
        orderId: 'mock-order-001', symbol: 'izky_usdt', side: 'buy',
        price: '0.0012', volume: '50000', dealVolume: '50000', dealPrice: '0.0012',
        transactTime: String(now - 3600_000),
      },
      {
        orderId: 'mock-order-002', symbol: 'izky_usdt', side: 'sell',
        price: '0.0013', volume: '40000', dealVolume: '40000', dealPrice: '0.0013',
        transactTime: String(now - 1800_000),
      },
    ],
    deposits: [],
    withdrawals: [
      { id: 'mock-withdrawal-001', amount: '200', coin: 'usdt', status: '4', timestamp: now - 3600_000 },
    ],
  },

  ineligible: {
    ...sameSnapshot({ usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '5000', izkyFreeze: '0', izkyPrice: 0.001 }),
    trades: [
      {
        orderId: 'mock-order-001', symbol: 'izky_usdt', side: 'buy',
        price: '0.001', volume: '50000', dealVolume: '50000', dealPrice: '0.001',
        transactTime: String(now - 3600_000),
      },
    ],
    deposits: [],
    withdrawals: [],
  },

  low_balance: {
    ...sameSnapshot({ usdtAvailable: '5', usdtFreeze: '0', izkyAvailable: '0', izkyFreeze: '0' }),
    trades: [],
    deposits: [],
    withdrawals: [],
  },

  // ── PNLテストシナリオ（start ≠ end） ──

  // A: 価格変動のみ（取引なし）
  // 開始: USDT=100, IZKY=10000, price=0.0012 → 総資産 112.00
  // 終了: USDT=100, IZKY=10000, price=0.0015 → 総資産 115.00
  // PNL: +3.00, PNL%: +2.68%, 出来高: 0（ineligible）
  pnl_price_change_only: {
    start: { usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '10000', izkyFreeze: '0', izkyPrice: 0.0012 },
    end:   { usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '10000', izkyFreeze: '0', izkyPrice: 0.0015 },
    trades: [],
    deposits: [],
    withdrawals: [],
  },

  // B: 取引 + 価格変動（標準）
  // 開始: USDT=100, IZKY=10000, price=0.0012 → 総資産 112.00
  // 終了: USDT=92, IZKY=20000, price=0.0014 → 総資産 120.00
  // 取引: BUY 50,000@0.0012, SELL 40,000@0.0013
  // PNL: +8.00, PNL%: +7.14%, 出来高: 112（eligible）
  pnl_trade_and_price: {
    start: { usdtAvailable: '100', usdtFreeze: '0', izkyAvailable: '10000', izkyFreeze: '0', izkyPrice: 0.0012 },
    end:   { usdtAvailable: '92',  usdtFreeze: '0', izkyAvailable: '20000', izkyFreeze: '0', izkyPrice: 0.0014 },
    trades: [
      {
        orderId: 'mock-pnl-001', symbol: 'izky_usdt', side: 'buy',
        price: '0.0012', volume: '50000', dealVolume: '50000', dealPrice: '0.0012',
        transactTime: String(now - 3600_000),
      },
      {
        orderId: 'mock-pnl-002', symbol: 'izky_usdt', side: 'sell',
        price: '0.0013', volume: '40000', dealVolume: '40000', dealPrice: '0.0013',
        transactTime: String(now - 1800_000),
      },
    ],
    deposits: [],
    withdrawals: [],
  },

  // C: 未決済ポジション評価（最重要）
  // 開始: USDT=1000, IZKY=0, price=0.0010 → 総資産 1000.00
  // 終了: USDT=300, IZKY=800000, price=0.0008 → 総資産 940.00
  // 取引: BUY 1,000,000@0.0010, SELL 200,000@0.0015
  //   決済ベース利益: +100 USDT
  //   未決済含み損: -160 USDT
  //   実質 PNL: -60.00, PNL%: -6.00%
  pnl_unrealized_position: {
    start: { usdtAvailable: '1000', usdtFreeze: '0', izkyAvailable: '0',      izkyFreeze: '0', izkyPrice: 0.0010 },
    end:   { usdtAvailable: '300',  usdtFreeze: '0', izkyAvailable: '800000', izkyFreeze: '0', izkyPrice: 0.0008 },
    trades: [
      {
        orderId: 'mock-pnl-003', symbol: 'izky_usdt', side: 'buy',
        price: '0.0010', volume: '1000000', dealVolume: '1000000', dealPrice: '0.0010',
        transactTime: String(now - 7200_000),
      },
      {
        orderId: 'mock-pnl-004', symbol: 'izky_usdt', side: 'sell',
        price: '0.0015', volume: '200000', dealVolume: '200000', dealPrice: '0.0015',
        transactTime: String(now - 3600_000),
      },
    ],
    deposits: [],
    withdrawals: [],
  },

  // D: 全額 IZKY 保有
  // 開始: USDT=0, IZKY=100000, price=0.0012 → 総資産 120.00
  // 終了: USDT=0, IZKY=100000, price=0.0018 → 総資産 180.00
  // PNL: +60.00, PNL%: +50.00%
  pnl_all_izky: {
    start: { usdtAvailable: '0', usdtFreeze: '0', izkyAvailable: '100000', izkyFreeze: '0', izkyPrice: 0.0012 },
    end:   { usdtAvailable: '0', usdtFreeze: '0', izkyAvailable: '100000', izkyFreeze: '0', izkyPrice: 0.0018 },
    trades: [],
    deposits: [],
    withdrawals: [],
  },

  // E: 価格下落 + 出来高不足
  // 開始: USDT=50, IZKY=50000, price=0.0020 → 総資産 150.00
  // 終了: USDT=14, IZKY=70000, price=0.0010 → 総資産 84.00
  // 取引: BUY 20,000@0.0018
  // PNL: -66.00, PNL%: -44.00%, 出来高: 36（ineligible）
  pnl_price_drop: {
    start: { usdtAvailable: '50', usdtFreeze: '0', izkyAvailable: '50000', izkyFreeze: '0', izkyPrice: 0.0020 },
    end:   { usdtAvailable: '14', usdtFreeze: '0', izkyAvailable: '70000', izkyFreeze: '0', izkyPrice: 0.0010 },
    trades: [
      {
        orderId: 'mock-pnl-005', symbol: 'izky_usdt', side: 'buy',
        price: '0.0018', volume: '20000', dealVolume: '20000', dealPrice: '0.0018',
        transactTime: String(now - 3600_000),
      },
    ],
    deposits: [],
    withdrawals: [],
  },
}

// ── ヘルパー ────────────────────────────────────

function getScenario(): ScenarioData {
  const name = (process.env.LBANK_MOCK_SCENARIO ?? 'normal') as Scenario
  const scenario = SCENARIOS[name]
  if (!scenario) {
    throw new Error(
      `Unknown LBANK_MOCK_SCENARIO: "${name}". Valid values: ${Object.keys(SCENARIOS).join(', ')}`
    )
  }
  return scenario
}

function getSnapshot(): BalanceSnapshot {
  const s = getScenario()
  return currentPhase === 'start' ? s.start : s.end
}

// テストから直接シナリオデータを取得するための関数
export function getScenarioData(name: Scenario): ScenarioData {
  const scenario = SCENARIOS[name]
  if (!scenario) {
    throw new Error(`Unknown scenario: "${name}"`)
  }
  return scenario
}

// ── モック関数（api.ts と同一シグネチャ） ───────

export async function mockGetUserInfo(
  _apiKey: string,
  _secretKey: string
): Promise<{ uid: string }> {
  return { uid: 'mock-uid-001' }
}

export async function mockGetAccountBalanceRaw(
  _apiKey: string,
  _secretKey: string
): Promise<unknown> {
  const snap = getSnapshot()
  return {
    uid: 'mock-uid-001',
    balances: [
      { asset: 'usdt', free: snap.usdtAvailable, locked: snap.usdtFreeze },
      { asset: 'izky', free: snap.izkyAvailable, locked: snap.izkyFreeze },
    ],
  }
}

export async function mockGetAccountBalance(
  _apiKey: string,
  _secretKey: string
): Promise<{ asset: string; available: string; freeze: string }[]> {
  const snap = getSnapshot()
  return [
    { asset: 'usdt', available: snap.usdtAvailable, freeze: snap.usdtFreeze },
    { asset: 'izky', available: snap.izkyAvailable, freeze: snap.izkyFreeze },
  ]
}

export async function mockGetUSDTBalance(
  _apiKey: string,
  _secretKey: string
): Promise<number> {
  const snap = getSnapshot()
  return parseFloat(snap.usdtAvailable) + parseFloat(snap.usdtFreeze)
}

export async function mockGetTransactionHistoryRaw(
  _apiKey: string,
  _secretKey: string,
  _symbol?: string,
  _startTime?: number,
  _limit?: number
): Promise<unknown> {
  const s = getScenario()
  return { orders: s.trades }
}

export async function mockGetTransactionHistory(
  _apiKey: string,
  _secretKey: string,
  _symbol?: string,
  _startTime?: number,
  _endTime?: number,
  _limit?: number
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
  const s = getScenario()
  return s.trades
}

export async function mockGetDepositHistory(
  _apiKey: string,
  _secretKey: string,
  _startTime: number,
  _endTime: number
): Promise<{ id: string; amount: string; coin: string; status: string; timestamp: number }[]> {
  const s = getScenario()
  return s.deposits
}

export async function mockGetWithdrawalHistory(
  _apiKey: string,
  _secretKey: string,
  _startTime: number,
  _endTime: number
): Promise<{ id: string; amount: string; coin: string; status: string; timestamp: number }[]> {
  const s = getScenario()
  return s.withdrawals
}

export async function mockGetIZKYPrice(): Promise<number> {
  const snap = getSnapshot()
  return snap.izkyPrice
}

export async function mockGetTotalBalanceUSDT(
  _apiKey: string,
  _secretKey: string
): Promise<{ totalUSDT: number; izkyPrice: number }> {
  const snap = getSnapshot()
  const usdtTotal = parseFloat(snap.usdtAvailable) + parseFloat(snap.usdtFreeze)
  const izkyTotal = parseFloat(snap.izkyAvailable) + parseFloat(snap.izkyFreeze)
  const izkyPrice = snap.izkyPrice
  return {
    totalUSDT: usdtTotal + izkyTotal * izkyPrice,
    izkyPrice,
  }
}

export async function mockGetVolumeForPair(
  _apiKey: string,
  _secretKey: string,
  _startTimestamp: number
): Promise<number> {
  const s = getScenario()
  let totalVolume = 0
  for (const trade of s.trades) {
    const vol = parseFloat(trade.dealVolume) * parseFloat(trade.dealPrice)
    if (!isNaN(vol)) totalVolume += vol
  }
  return totalVolume
}

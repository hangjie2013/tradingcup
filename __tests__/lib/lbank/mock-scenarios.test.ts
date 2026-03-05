import { describe, it, expect, beforeEach } from 'vitest'
import {
  setMockPhase,
  resetMockPhase,
  mockGetTotalBalanceUSDT,
  mockGetVolumeForPair,
  getScenarioData,
} from '@/lib/lbank/mock'
import { calculatePNL, calculateTotalBalance } from '@/lib/cup/pnl'

// テスト用にシナリオを直接設定するヘルパー
function setScenario(name: string) {
  process.env.LBANK_MOCK_SCENARIO = name
}

beforeEach(() => {
  resetMockPhase()
  delete process.env.LBANK_MOCK_SCENARIO
})

describe('モック start/end フェーズ切り替え', () => {
  it('start フェーズと end フェーズで異なる値を返す', async () => {
    setScenario('pnl_price_change_only')

    setMockPhase('start')
    const startResult = await mockGetTotalBalanceUSDT('key', 'secret')

    setMockPhase('end')
    const endResult = await mockGetTotalBalanceUSDT('key', 'secret')

    // start: 100 + 10000 × 0.0012 = 112.00
    expect(startResult.totalUSDT).toBeCloseTo(112.00, 2)
    // end: 100 + 10000 × 0.0015 = 115.00
    expect(endResult.totalUSDT).toBeCloseTo(115.00, 2)
    expect(startResult.totalUSDT).not.toBe(endResult.totalUSDT)
  })

  it('既存シナリオ（normal）は start と end が同じ値を返す', async () => {
    setScenario('normal')

    setMockPhase('start')
    const startResult = await mockGetTotalBalanceUSDT('key', 'secret')

    setMockPhase('end')
    const endResult = await mockGetTotalBalanceUSDT('key', 'secret')

    expect(startResult.totalUSDT).toBe(endResult.totalUSDT)
  })
})

describe('PNL テストシナリオ — モック統合', () => {
  const scenarios = [
    {
      name: 'pnl_price_change_only',
      label: 'A: 価格変動のみ',
      expectedStartBalance: 112.00,
      expectedEndBalance: 115.00,
      expectedPNL: 3.00,
      expectedPNLPct: 2.68,
      expectedVolume: 0,
      eligible: false,
    },
    {
      name: 'pnl_trade_and_price',
      label: 'B: 取引 + 価格変動',
      expectedStartBalance: 112.00,
      expectedEndBalance: 120.00,
      expectedPNL: 8.00,
      expectedPNLPct: 7.14,
      expectedVolume: 112, // BUY 50000×0.0012=60 + SELL 40000×0.0013=52 = 112
      eligible: true,
    },
    {
      name: 'pnl_unrealized_position',
      label: 'C: 未決済ポジション（最重要）',
      expectedStartBalance: 1000.00,
      expectedEndBalance: 940.00,
      expectedPNL: -60.00,
      expectedPNLPct: -6.00,
      expectedVolume: 1300, // BUY 1000000×0.0010=1000 + SELL 200000×0.0015=300 = 1300
      eligible: true,
    },
    {
      name: 'pnl_all_izky',
      label: 'D: 全額 IZKY',
      expectedStartBalance: 120.00,
      expectedEndBalance: 180.00,
      expectedPNL: 60.00,
      expectedPNLPct: 50.00,
      expectedVolume: 0,
      eligible: false,
    },
    {
      name: 'pnl_price_drop',
      label: 'E: 価格下落',
      expectedStartBalance: 150.00,
      expectedEndBalance: 84.00,
      expectedPNL: -66.00,
      expectedPNLPct: -44.00,
      expectedVolume: 36, // BUY 20000×0.0018=36
      eligible: false,
    },
  ] as const

  for (const scenario of scenarios) {
    describe(scenario.label, () => {
      beforeEach(() => {
        setScenario(scenario.name)
      })

      it('開始資産が正しい', async () => {
        setMockPhase('start')
        const { totalUSDT } = await mockGetTotalBalanceUSDT('key', 'secret')
        expect(totalUSDT).toBeCloseTo(scenario.expectedStartBalance, 2)
      })

      it('終了資産が正しい', async () => {
        setMockPhase('end')
        const { totalUSDT } = await mockGetTotalBalanceUSDT('key', 'secret')
        expect(totalUSDT).toBeCloseTo(scenario.expectedEndBalance, 2)
      })

      it('PNL / PNL% が仕様通り', async () => {
        setMockPhase('start')
        const { totalUSDT: startBalance } = await mockGetTotalBalanceUSDT('key', 'secret')

        setMockPhase('end')
        const { totalUSDT: endBalance } = await mockGetTotalBalanceUSDT('key', 'secret')

        const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
        expect(pnl).toBeCloseTo(scenario.expectedPNL, 2)
        expect(pnlPct).toBeCloseTo(scenario.expectedPNLPct, 2)
      })

      it('出来高が正しい', async () => {
        const volume = await mockGetVolumeForPair('key', 'secret', 0)
        expect(volume).toBeCloseTo(scenario.expectedVolume, 2)
      })

      it(`出来高適格性: ${scenario.eligible ? 'eligible' : 'ineligible'}`, async () => {
        const volume = await mockGetVolumeForPair('key', 'secret', 0)
        const minVolume = 100
        expect(volume >= minVolume).toBe(scenario.eligible)
      })
    })
  }
})

describe('calculateTotalBalance とモックの整合性', () => {
  it('getScenarioData の値から手計算した総資産と mockGetTotalBalanceUSDT が一致する', async () => {
    setScenario('pnl_unrealized_position')

    const data = getScenarioData('pnl_unrealized_position')

    // start
    setMockPhase('start')
    const { totalUSDT: mockStart } = await mockGetTotalBalanceUSDT('key', 'secret')
    const manualStart = calculateTotalBalance(
      parseFloat(data.start.usdtAvailable),
      parseFloat(data.start.izkyAvailable),
      data.start.izkyPrice
    )
    expect(mockStart).toBeCloseTo(manualStart, 10)

    // end
    setMockPhase('end')
    const { totalUSDT: mockEnd } = await mockGetTotalBalanceUSDT('key', 'secret')
    const manualEnd = calculateTotalBalance(
      parseFloat(data.end.usdtAvailable),
      parseFloat(data.end.izkyAvailable),
      data.end.izkyPrice
    )
    expect(mockEnd).toBeCloseTo(manualEnd, 10)
  })
})

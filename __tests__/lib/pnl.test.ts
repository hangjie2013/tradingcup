import { describe, it, expect } from 'vitest'
import { calculatePNL, calculateTotalBalance } from '@/lib/cup/pnl'

describe('calculateTotalBalance', () => {
  it('USDT + IZKY × price で総資産を計算する', () => {
    expect(calculateTotalBalance(100, 10000, 0.0012)).toBeCloseTo(112.00, 2)
  })

  it('IZKY が 0 の場合は USDT のみ', () => {
    expect(calculateTotalBalance(1000, 0, 0.0010)).toBeCloseTo(1000.00, 2)
  })

  it('USDT が 0 の場合は IZKY × price のみ', () => {
    expect(calculateTotalBalance(0, 100000, 0.0012)).toBeCloseTo(120.00, 2)
  })
})

describe('calculatePNL', () => {
  // A: price_change_only — 価格変動のみ
  it('A: 価格変動のみ — PNL +3.00, PNL% +2.68%', () => {
    const startBalance = 112.00  // 100 + 10000 × 0.0012
    const endBalance = 115.00    // 100 + 10000 × 0.0015
    const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
    expect(pnl).toBeCloseTo(3.00, 2)
    expect(pnlPct).toBeCloseTo(2.68, 2)
  })

  // B: trade_and_price_change — 取引 + 価格変動
  it('B: 取引 + 価格変動 — PNL +8.00, PNL% +7.14%', () => {
    const startBalance = 112.00  // 100 + 10000 × 0.0012
    const endBalance = 120.00    // 92 + 20000 × 0.0014
    const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
    expect(pnl).toBeCloseTo(8.00, 2)
    expect(pnlPct).toBeCloseTo(7.14, 2)
  })

  // C: unrealized_position — 未決済ポジション評価（最重要）
  it('C: 未決済ポジション — PNL -60.00, PNL% -6.00%', () => {
    const startBalance = 1000.00  // 1000 + 0 × 0.0010
    const endBalance = 940.00     // 300 + 800000 × 0.0008
    const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
    expect(pnl).toBeCloseTo(-60.00, 2)
    expect(pnlPct).toBeCloseTo(-6.00, 2)
  })

  // D: all_izky — 全額 IZKY 保有
  it('D: 全額 IZKY — PNL +60.00, PNL% +50.00%', () => {
    const startBalance = 120.00  // 0 + 100000 × 0.0012
    const endBalance = 180.00    // 0 + 100000 × 0.0018
    const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
    expect(pnl).toBeCloseTo(60.00, 2)
    expect(pnlPct).toBeCloseTo(50.00, 2)
  })

  // E: price_drop — 価格下落
  it('E: 価格下落 — PNL -66.00, PNL% -44.00%', () => {
    const startBalance = 150.00  // 50 + 50000 × 0.0020
    const endBalance = 84.00     // 14 + 70000 × 0.0010
    const { pnl, pnlPct } = calculatePNL(startBalance, endBalance)
    expect(pnl).toBeCloseTo(-66.00, 2)
    expect(pnlPct).toBeCloseTo(-44.00, 2)
  })

  // エッジケース
  it('開始残高が 0 の場合は PNL% = 0（ゼロ除算回避）', () => {
    const { pnl, pnlPct } = calculatePNL(0, 100)
    expect(pnl).toBe(100)
    expect(pnlPct).toBe(0)
  })

  it('開始と終了が同じ場合は PNL = 0', () => {
    const { pnl, pnlPct } = calculatePNL(112, 112)
    expect(pnl).toBe(0)
    expect(pnlPct).toBe(0)
  })
})

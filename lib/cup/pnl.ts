/**
 * PNL 計算（CLAUDE.md セクション 4）
 *
 * PNL = 終了総資産 − 開始総資産
 * PNL% = (PNL ÷ 開始総資産) × 100
 */
export function calculatePNL(startBalance: number, currentBalance: number) {
  const pnl = currentBalance - startBalance
  const pnlPct = startBalance > 0 ? (pnl / startBalance) * 100 : 0
  return { pnl, pnlPct }
}

/**
 * 総資産の計算（CLAUDE.md セクション 4.1 / 4.2）
 *
 * 総資産 = USDT残高 + IZKY残高 × 時点価格
 */
export function calculateTotalBalance(usdtBalance: number, izkyBalance: number, izkyPrice: number): number {
  return usdtBalance + izkyBalance * izkyPrice
}

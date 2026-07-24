import { CurrencyAmount, Fraction } from '@uniswap/sdk-core'
import { USDC, USDT } from 'uniswap/src/constants/tokens'
import {
  getMigratedPositionShare,
  PARTIAL_MIGRATION_WARNING_THRESHOLD,
} from '~/features/Liquidity/PartialMigrationWarning'
import { ETH_MAINNET } from '~/test-utils/constants'

const eth = (amount: string) => CurrencyAmount.fromRawAmount(ETH_MAINNET, amount)
const usdt = (amount: string) => CurrencyAmount.fromRawAmount(USDT, amount)
const usd = (amount: string) => CurrencyAmount.fromRawAmount(USDC, amount)

describe('getMigratedPositionShare', () => {
  it('returns undefined without amounts to migrate', () => {
    expect(getMigratedPositionShare({})).toBeUndefined()
    expect(
      getMigratedPositionShare({
        currencyAmounts: { TOKEN0: eth('0'), TOKEN1: usdt('0') },
        refundedAmounts: { TOKEN0: eth('1') },
      }),
    ).toBeUndefined()
  })

  it('returns 1 when nothing is refunded', () => {
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('1000'), TOKEN1: usdt('2000') },
      refundedAmounts: { TOKEN0: eth('0'), TOKEN1: undefined },
    })
    expect(share?.equalTo(new Fraction(1))).toBe(true)
  })

  it('combines both tokens by USD value when available', () => {
    // Position worth $400 total, $100 refunded -> 75% migrates
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100'), TOKEN1: usdt('300') },
      refundedAmounts: { TOKEN0: eth('99'), TOKEN1: usdt('1') },
      currencyAmountsUSDValue: { TOKEN0: usd('100000000'), TOKEN1: usd('300000000') },
      refundedAmountsUSDValue: { TOKEN0: usd('99000000'), TOKEN1: usd('1000000') },
    })
    expect(share?.equalTo(new Fraction(3, 4))).toBe(true)
  })

  it('includes uncollected fees in the USD denominator', () => {
    // $400 principal + $100 uncollected fees sent to the migrator, $100 refunded -> 80% migrates
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100'), TOKEN1: usdt('300') },
      feeAmounts: { TOKEN0: eth('100') },
      refundedAmounts: { TOKEN0: eth('100') },
      currencyAmountsUSDValue: { TOKEN0: usd('100000000'), TOKEN1: usd('300000000') },
      feeAmountsUSDValue: { TOKEN0: usd('100000000') },
      refundedAmountsUSDValue: { TOKEN0: usd('100000000') },
    })
    expect(share?.equalTo(new Fraction(4, 5))).toBe(true)
  })

  it('includes uncollected fees in the per-token denominator', () => {
    // The backend refund covers principal + fees, so a refund larger than the principal
    // alone must not read as a 0% migration: 1 - 120/(100+50) = 20% migrates
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100') },
      feeAmounts: { TOKEN0: eth('50') },
      refundedAmounts: { TOKEN0: eth('120') },
    })
    expect(share?.equalTo(new Fraction(1, 5))).toBe(true)
  })

  it('falls back to the worst per-token share when USD values are missing', () => {
    // 90% of token0 refunded, none of token1 -> 10% migrated share
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100'), TOKEN1: usdt('300') },
      refundedAmounts: { TOKEN0: eth('90') },
    })
    expect(share?.equalTo(new Fraction(1, 10))).toBe(true)
  })

  it('ignores USD math when a non-zero amount is missing its USD value', () => {
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100'), TOKEN1: usdt('300') },
      refundedAmounts: { TOKEN0: eth('50'), TOKEN1: usdt('30') },
      currencyAmountsUSDValue: { TOKEN0: usd('100000000') },
      refundedAmountsUSDValue: { TOKEN0: usd('50000000'), TOKEN1: usd('30000000') },
    })
    // Falls back to worst per-token share: token0 migrates 50%
    expect(share?.equalTo(new Fraction(1, 2))).toBe(true)
  })

  it('ignores USD math when a non-zero fee amount is missing its USD value', () => {
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100') },
      feeAmounts: { TOKEN0: eth('100') },
      refundedAmounts: { TOKEN0: eth('100') },
      currencyAmountsUSDValue: { TOKEN0: usd('100000000') },
      refundedAmountsUSDValue: { TOKEN0: usd('100000000') },
    })
    // Falls back to per-token math over principal + fees: 1 - 100/200
    expect(share?.equalTo(new Fraction(1, 2))).toBe(true)
  })

  it('clamps to zero when refunds exceed totals', () => {
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100') },
      refundedAmounts: { TOKEN0: eth('150') },
    })
    expect(share?.equalTo(new Fraction(0))).toBe(true)
  })

  it('clamps to zero when refunds exceed principal plus fees', () => {
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('100') },
      feeAmounts: { TOKEN0: eth('20') },
      refundedAmounts: { TOKEN0: eth('150') },
      currencyAmountsUSDValue: { TOKEN0: usd('100000000') },
      feeAmountsUSDValue: { TOKEN0: usd('20000000') },
      refundedAmountsUSDValue: { TOKEN0: usd('150000000') },
    })
    expect(share?.equalTo(new Fraction(0))).toBe(true)
  })

  it('handles one-sided positions (LP-833 scenario)', () => {
    // Out-of-range position holds only token0; almost all of it is refunded
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('1000'), TOKEN1: usdt('0') },
      refundedAmounts: { TOKEN0: eth('980') },
    })
    expect(share?.equalTo(new Fraction(2, 100))).toBe(true)
    expect(share?.lessThan(PARTIAL_MIGRATION_WARNING_THRESHOLD)).toBe(true)
  })

  it('does not warn for refunds above the threshold', () => {
    // 40% refunded -> 60% migrates, above the 50% warning threshold
    const share = getMigratedPositionShare({
      currencyAmounts: { TOKEN0: eth('1000'), TOKEN1: usdt('1000') },
      refundedAmounts: { TOKEN0: eth('400') },
    })
    expect(share?.lessThan(PARTIAL_MIGRATION_WARNING_THRESHOLD)).toBe(false)
  })
})

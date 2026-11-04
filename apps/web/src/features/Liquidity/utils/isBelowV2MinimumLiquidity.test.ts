import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { isBelowV2MinimumLiquidity } from '~/features/Liquidity/utils/isBelowV2MinimumLiquidity'

// WBTC/cbBTC on Base, both 8 decimals; WBTC sorts first so it is token0.
const WBTC = new Token(UniverseChainId.Base, '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', 8, 'WBTC')
const CBBTC = new Token(UniverseChainId.Base, '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', 8, 'cbBTC')

function check(raw0: string, raw1: string): boolean {
  return isBelowV2MinimumLiquidity({
    amount0: CurrencyAmount.fromRawAmount(WBTC, raw0),
    amount1: CurrencyAmount.fromRawAmount(CBBTC, raw1),
  })
}

describe('isBelowV2MinimumLiquidity', () => {
  it('flags the reported repro: 0.00000609 WBTC at price 0.99915848 gives sqrt(609 * 608) = 608', () => {
    expect(check('609', '608')).toBe(true)
  })

  it('flags sqrt exactly at MINIMUM_LIQUIDITY, which mints zero liquidity', () => {
    expect(check('1000', '1000')).toBe(true)
    // 1001 * 1001 - 1 floors to a sqrt of 1000
    expect(check('1', '1002000')).toBe(true)
  })

  it('allows the smallest deposit whose sqrt clears MINIMUM_LIQUIDITY', () => {
    expect(check('1001', '1001')).toBe(false)
    expect(check('1', '1002001')).toBe(false)
  })

  it('weighs the product of both sides, not each side alone', () => {
    expect(check('10', '100000')).toBe(true)
    expect(check('10', '110000')).toBe(false)
  })

  it('flags a zero-sided deposit', () => {
    expect(check('0', '1000000000')).toBe(true)
  })

  it('does not flag while either amount is missing', () => {
    expect(isBelowV2MinimumLiquidity({ amount0: undefined, amount1: CurrencyAmount.fromRawAmount(CBBTC, '1') })).toBe(
      false,
    )
    expect(isBelowV2MinimumLiquidity({ amount0: CurrencyAmount.fromRawAmount(WBTC, '1'), amount1: null })).toBe(false)
  })
})

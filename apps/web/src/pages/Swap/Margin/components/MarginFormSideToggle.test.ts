import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { type MarginPairGroup, USDC, USDT, WETH } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { findMarginSideCounterpart } from '~/pages/Swap/Margin/components/MarginFormSideToggle'

const WBTC = { ...USDT, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' } as const
const group = (pairKey: string, direction: MarginDirection, base = WETH, quote = USDC): MarginPairGroup =>
  ({ pairKey, direction, base, quote }) as unknown as MarginPairGroup

// The default market is the WETH/USDC long.
const find = (groups: MarginPairGroup[]) =>
  findMarginSideCounterpart(groups, { market: getDefaultMarginMarket(), direction: MarginDirection.SHORT })?.pairKey

describe(findMarginSideCounterpart, () => {
  it.each([
    {
      name: 'the same pair the other way round',
      groups: [group('usdt', MarginDirection.SHORT, WETH, USDT), group('usdc', MarginDirection.SHORT)],
      expected: 'usdc',
    },
    {
      name: 'the same base against another quote',
      groups: [group('usdt', MarginDirection.SHORT, WETH, USDT)],
      expected: 'usdt',
    },
    {
      name: 'nothing when the base has no short',
      groups: [group('wbtc', MarginDirection.SHORT, WBTC), group('long', MarginDirection.LONG)],
      expected: undefined,
    },
  ])('lands on $name', ({ groups, expected }) => {
    expect(find(groups)).toBe(expected)
  })
})

import { fireEvent } from '@testing-library/react'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket, MarginPairGroup, MarginTokenInfo } from '~/constants/margin'
import {
  findMarginSideCounterpart,
  MarginFormSideToggle,
  MarginSideToggle,
} from '~/pages/Swap/Margin/components/MarginSideToggle'
import { render } from '~/test-utils/render'

const WETH: MarginTokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  decimals: 18,
}
const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}

const USDT: MarginTokenInfo = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  symbol: 'USDT',
  decimals: 6,
}

function groupFixture(direction: MarginDirection, quote: MarginTokenInfo = USDC): MarginPairGroup {
  const quoteKey = quote.symbol.toLowerCase()
  return {
    key: `weth-${quoteKey}-${direction}`,
    pairKey: (direction === MarginDirection.SHORT
      ? `${quoteKey}-weth`
      : `weth-${quoteKey}`) as MarginPairGroup['pairKey'],
    base: WETH,
    quote,
    direction,
    pairs: [{ key: `weth-usdc-MORPHO-${direction}`, debt: USDC, venue: 'MORPHO', lltvWad: '0', maxLeverage: 5 }],
  }
}

const { mockGroups, mockSide, setMarginFormState } = vi.hoisted(() => ({
  mockGroups: { current: [] as MarginPairGroup[] },
  // Filled in below: vi.hoisted runs before the MarginDirection import is bound.
  mockSide: {} as { current: MarginDirection },
  setMarginFormState: vi.fn(),
}))
mockSide.current = MarginDirection.LONG

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({ groups: mockGroups.current }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { side: MarginDirection }) => unknown) => selector({ side: mockSide.current }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

function isDisabled(element: HTMLElement): boolean {
  return element.getAttribute('aria-disabled') === 'true'
}

beforeEach(() => {
  mockGroups.current = [groupFixture(MarginDirection.LONG), groupFixture(MarginDirection.SHORT)]
})

afterEach(() => {
  mockSide.current = MarginDirection.LONG
  setMarginFormState.mockClear()
})

describe('MarginSideToggle', () => {
  it('offers both sides when the registry has a group for each', () => {
    const { getByRole } = render(<MarginSideToggle />)
    expect(isDisabled(getByRole('button', { name: 'Long' }))).toBe(false)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(false)
  })

  // Availability is derived, not hardcoded: a pair the server only lists one way round must not offer
  // a side that would leave the user staring at an empty list.
  it('disables a side the registry has no group for', () => {
    mockGroups.current = [groupFixture(MarginDirection.LONG)]
    const { getByRole } = render(<MarginSideToggle />)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(true)
  })

  it('still selects a side the registry does have', () => {
    mockGroups.current = [groupFixture(MarginDirection.LONG), groupFixture(MarginDirection.SHORT)]
    const { getByRole } = render(<MarginSideToggle />)
    fireEvent.click(getByRole('button', { name: 'Short' }))
    expect(setMarginFormState).toHaveBeenCalledWith({ side: MarginDirection.SHORT })
  })

  // Nothing is known before the first response lands, so neither side is greyed out on the way in.
  it('offers both sides while the registry is empty', () => {
    mockGroups.current = []
    const { getByRole } = render(<MarginSideToggle />)
    expect(isDisabled(getByRole('button', { name: 'Long' }))).toBe(false)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(false)
  })

  // A stored side the registry dropped stays enabled: the control has to be able to render its own
  // selection, and a disabled-yet-selected segment reads as broken.
  it('keeps the selected side enabled even once its groups disappear', () => {
    mockGroups.current = [groupFixture(MarginDirection.LONG)]
    mockSide.current = MarginDirection.SHORT
    const { getByRole } = render(<MarginSideToggle />)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(false)
  })
})

const LONG_MARKET: MarginMarket = {
  key: 'weth-usdc-MORPHO',
  asset: 'WETH',
  name: 'Ethereum',
  displaySymbol: 'ETH',
  collateral: WETH,
  debt: USDC,
  venue: 'MORPHO',
  direction: MarginDirection.LONG,
  lltvWad: '860000000000000000',
  maxLeverage: 5,
  shouldUseNativeEquity: true,
}

describe('findMarginSideCounterpart', () => {
  it('prefers the same pair the other way round', () => {
    const groups = [
      groupFixture(MarginDirection.LONG),
      groupFixture(MarginDirection.SHORT, USDT),
      groupFixture(MarginDirection.SHORT),
    ]
    expect(findMarginSideCounterpart({ groups, market: LONG_MARKET, direction: MarginDirection.SHORT })?.pairKey).toBe(
      'usdc-weth',
    )
  })

  it('falls back to the same base token against another quote', () => {
    const groups = [groupFixture(MarginDirection.LONG), groupFixture(MarginDirection.SHORT, USDT)]
    expect(findMarginSideCounterpart({ groups, market: LONG_MARKET, direction: MarginDirection.SHORT })?.pairKey).toBe(
      'usdt-weth',
    )
  })

  it('finds nothing when the base token does not trade on that side', () => {
    expect(
      findMarginSideCounterpart({
        groups: [groupFixture(MarginDirection.LONG)],
        market: LONG_MARKET,
        direction: MarginDirection.SHORT,
      }),
    ).toBe(undefined)
  })
})

describe('MarginFormSideToggle', () => {
  it('selects the displayed market’s side, not the stored one', () => {
    mockSide.current = MarginDirection.SHORT
    const { getByRole } = render(<MarginFormSideToggle market={LONG_MARKET} />)
    expect(getByRole('button', { name: 'Long' })).toHaveAttribute('aria-selected', 'true')
    expect(getByRole('button', { name: 'Short' })).toHaveAttribute('aria-selected', 'false')
  })

  // A pair's long and short are different pairs, so the side switch has to move the form's pair too.
  it('switches the form to the counterpart pair and resets the payment token', () => {
    const { getByRole } = render(<MarginFormSideToggle market={LONG_MARKET} />)
    fireEvent.click(getByRole('button', { name: 'Short' }))
    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: 'usdc-weth',
      side: MarginDirection.SHORT,
      paymentToken: undefined,
    })
  })

  it('disables Short for a base token with no short market', () => {
    mockGroups.current = [groupFixture(MarginDirection.LONG)]
    const { getByRole } = render(<MarginFormSideToggle market={LONG_MARKET} />)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(true)
  })

  it('does nothing when the already-selected side is pressed', () => {
    const { getByRole } = render(<MarginFormSideToggle market={LONG_MARKET} />)
    fireEvent.click(getByRole('button', { name: 'Long' }))
    expect(setMarginFormState).not.toHaveBeenCalled()
  })
})

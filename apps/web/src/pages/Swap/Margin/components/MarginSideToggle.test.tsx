import { fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginPairGroup, MarginTokenInfo } from '~/constants/margin'
import { MarginSideToggle } from '~/pages/Swap/Margin/components/MarginSideToggle'
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

function groupFixture(direction: 'LONG' | 'SHORT'): MarginPairGroup {
  return {
    key: `weth-usdc-${direction}`,
    pairKey: 'weth-usdc',
    base: WETH,
    quote: USDC,
    direction,
    pairs: [{ key: `weth-usdc-MORPHO-${direction}`, debt: USDC, venue: 'MORPHO', lltvWad: '0', maxLeverage: 5 }],
  }
}

const { mockGroups, mockSide, setMarginFormState } = vi.hoisted(() => ({
  mockGroups: { current: [] as MarginPairGroup[] },
  mockSide: { current: 'long' as 'long' | 'short' },
  setMarginFormState: vi.fn(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({ groups: mockGroups.current }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { side: 'long' | 'short' }) => unknown) => selector({ side: mockSide.current }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

function isDisabled(element: HTMLElement): boolean {
  return element.getAttribute('aria-disabled') === 'true'
}

beforeEach(() => {
  mockGroups.current = [groupFixture('LONG'), groupFixture('SHORT')]
})

afterEach(() => {
  mockSide.current = 'long'
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
  it('disables a side the registry has no group for, and refuses to select it', () => {
    mockGroups.current = [groupFixture('LONG')]
    const { getByRole } = render(<MarginSideToggle />)
    const short = getByRole('button', { name: 'Short' })
    expect(isDisabled(short)).toBe(true)
    fireEvent.click(short)
    expect(setMarginFormState).not.toHaveBeenCalled()
  })

  it('still selects a side the registry does have', () => {
    mockGroups.current = [groupFixture('LONG'), groupFixture('SHORT')]
    const { getByRole } = render(<MarginSideToggle />)
    fireEvent.click(getByRole('button', { name: 'Short' }))
    expect(setMarginFormState).toHaveBeenCalledWith({ side: 'short' })
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
    mockGroups.current = [groupFixture('LONG')]
    mockSide.current = 'short'
    const { getByRole } = render(<MarginSideToggle />)
    expect(isDisabled(getByRole('button', { name: 'Short' }))).toBe(false)
  })
})

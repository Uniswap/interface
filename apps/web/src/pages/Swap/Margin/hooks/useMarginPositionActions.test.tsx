import { renderHook } from '@testing-library/react'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useMarginPositionActions } from '~/pages/Swap/Margin/hooks/useMarginPositionActions'

const MARKET = getDefaultMarginMarket()

const { mockUseIsPlanInFlight, mockSendAnalyticsEvent } = vi.hoisted(() => ({
  mockUseIsPlanInFlight: vi.fn(() => false),
  mockSendAnalyticsEvent: vi.fn(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mockSendAnalyticsEvent }))

const POSITION: MarginActivePosition = {
  status: 'ACTIVE',
  positionId: 'position-7',
  direction: 'LONG',
  exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: 1, decimals: MARKET.debt.decimals },
  size: '2000000000000000000',
  entryPrice: '2000000000000000000000',
  openedAt: '1700000000',
  legs: [
    { venue: MARKET.venue, subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '2000000000' },
  ],
  isTradable: true,
  equity: '2000000000000000000',
  oraclePrice: '2000000000000000000000',
  liquidationPrice: '1162790697674418604651',
  buffer: '400000000000000000',
  healthFactor: '1720000000000000000',
  maxWithdrawable: '500000000000000000',
  leverage: '2',
}

function renderActions({
  position = POSITION,
  onSelect = vi.fn(),
  surface = 'menu' as const,
}: {
  position?: MarginActivePosition
  onSelect?: (request: { action: string; positionId: string }) => void
  surface?: 'menu' | 'drawer'
} = {}): ReturnType<typeof renderHook<ReturnType<typeof useMarginPositionActions>, unknown>> {
  return renderHook(() => useMarginPositionActions({ position, onSelect, surface })) as ReturnType<
    typeof renderHook<ReturnType<typeof useMarginPositionActions>, unknown>
  >
}

describe('useMarginPositionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
  })

  it('returns the five actions in order', () => {
    const { result } = renderActions()
    expect(result.current.map((item) => item.action)).toEqual(['add', 'withdraw', 'leverage', 'adjust', 'close'])
  })

  it('gives every action an icon and both copy registers', () => {
    const { result } = renderActions()
    for (const item of result.current) {
      expect(item.Icon).toBeDefined()
      expect(item.label.length).toBeGreaterThan(0)
      // The menu column wraps rather than truncates; long subheaders make a ~450px-tall menu.
      expect(item.subheader.length).toBeLessThanOrEqual(32)
      // The tooltip carries the full sentence — never the same string as the menu fragment.
      expect(item.tooltipBody).not.toBe(item.subheader)
    }
  })

  it('marks close destructive and divided', () => {
    const { result } = renderActions()
    const close = result.current.find((item) => item.action === 'close')
    expect(close?.destructive).toBe(true)
    expect(close?.showDivider).toBe(true)
  })

  it('leaves everything enabled on a manageable, idle position', () => {
    const { result } = renderActions()
    expect(result.current.every((item) => !item.disabled)).toBe(true)
  })

  it('disables every action when the position has no on-chain leg subId', () => {
    const { result } = renderActions({ position: { ...POSITION, legs: [{ ...POSITION.legs[0]!, subId: '' }] } })
    // [].every() is true — without the length assertion this passes against a hook returning nothing.
    expect(result.current).toHaveLength(5)
    expect(result.current.every((item) => item.disabled)).toBe(true)
  })

  it('replaces the subheader with the in-flight reason while a plan is running', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    const { result } = renderActions()
    expect(result.current).toHaveLength(5)
    expect(result.current.every((item) => item.disabled)).toBe(true)
    expect(result.current.every((item) => item.subheader === 'Another action is in progress')).toBe(true)
    // The drawer tooltip reads tooltipBody, not subheader — swapping only one leaves that surface
    // describing the normal action while the button is dead.
    expect(result.current.every((item) => item.tooltipBody === 'Another action is in progress')).toBe(true)
    // The destructive item must grey out too — getMenuItemColor tests destructive BEFORE disabled.
    expect(result.current.find((item) => item.action === 'close')?.iconColor).toBe('$neutral2')
    expect(result.current.find((item) => item.action === 'close')?.textColor).toBe('$neutral2')
  })

  it('keeps close red while it is still actionable', () => {
    const { result } = renderActions()
    expect(result.current.find((item) => item.action === 'close')?.iconColor).toBeUndefined()
  })

  // The modal request keys off positionId (always present) rather than the retired
  // top-level account address.
  it('passes the action and the positionId to onSelect', () => {
    const onSelect = vi.fn()
    const { result } = renderActions({ onSelect })
    result.current[0]?.onPress()
    expect(onSelect).toHaveBeenCalledWith({ action: 'add', positionId: POSITION.positionId })
  })

  it('reports the action and surface to analytics', () => {
    const { result } = renderActions({ surface: 'drawer' })
    result.current[4]?.onPress()
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.MarginPositionActionSelected, {
      action: 'close',
      surface: 'drawer',
    })
  })
})

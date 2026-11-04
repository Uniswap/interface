import { renderHook } from '@testing-library/react'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { useIsWebFORNudgeActive } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsWebFORNudgeActive'

const { mockUseIsWebFORNudgeEnabled, mockUseParsedSwapWarnings } = vi.hoisted(() => ({
  mockUseIsWebFORNudgeEnabled: vi.fn(),
  mockUseParsedSwapWarnings: vi.fn(),
}))

vi.mock('uniswap/src/features/providers/webForNudgeProvider', () => ({
  useIsWebFORNudgeEnabled: () => mockUseIsWebFORNudgeEnabled(),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings', () => ({
  useParsedSwapWarnings: () => mockUseParsedSwapWarnings(),
}))

function blocking(type: WarningLabel, buttonText?: string): Warning {
  return { type, severity: WarningSeverity.Blocked, action: WarningAction.DisableReview, buttonText }
}

function setBlockingWarning(blockingWarning: Warning | undefined): void {
  mockUseParsedSwapWarnings.mockReturnValue({ blockingWarning })
}

describe(useIsWebFORNudgeActive, () => {
  beforeEach(() => {
    mockUseIsWebFORNudgeEnabled.mockReturnValue(true)
    setBlockingWarning(undefined)
  })

  it('is inactive when the nudge is not enabled', () => {
    mockUseIsWebFORNudgeEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useIsWebFORNudgeActive())

    expect(result.current).toBe(false)
  })

  it('is active with no blocking warning', () => {
    const { result } = renderHook(() => useIsWebFORNudgeActive())

    expect(result.current).toBe(true)
  })

  it.each([WarningLabel.InsufficientFunds, WarningLabel.InsufficientGasFunds])(
    'stays active over a %s warning, since funding fixes it',
    (type) => {
      setBlockingWarning(blocking(type, 'Not enough ETH'))

      const { result } = renderHook(() => useIsWebFORNudgeActive())

      expect(result.current).toBe(true)
    },
  )

  it.each([WarningLabel.BlockedToken, WarningLabel.GeoRestricted])(
    'yields to a %s warning, since funding would not make the token tradable',
    (type) => {
      setBlockingWarning(blocking(type, 'Not available'))

      const { result } = renderHook(() => useIsWebFORNudgeActive())

      expect(result.current).toBe(false)
    },
  )

  it('stays active over a blocking warning without its own button copy', () => {
    setBlockingWarning(blocking(WarningLabel.FormIncomplete))

    const { result } = renderHook(() => useIsWebFORNudgeActive())

    expect(result.current).toBe(true)
  })
})

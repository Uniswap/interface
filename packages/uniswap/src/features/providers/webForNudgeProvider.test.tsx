import { act, type RenderHookResult, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import {
  useIsShowingWebFORNudge,
  useIsWebFORNudgeEnabled,
  useSetIsShowingWebFORNudge,
  WebFORNudgeProvider,
} from 'uniswap/src/features/providers/webForNudgeProvider'

const mocks = vi.hoisted(() => ({ isPortfolioZero: true }))

vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/environment')>()),
  isWebApp: true,
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsPortfolioZero', () => ({
  useIsPortfolioZero: (): boolean => mocks.isPortfolioZero,
}))

type NudgeState = { isEnabled: boolean; isShowing: boolean; setIsShowing: (v: boolean) => void }

function renderNudge(): RenderHookResult<NudgeState, unknown> {
  return renderHook(
    () => ({
      isEnabled: useIsWebFORNudgeEnabled(),
      isShowing: useIsShowingWebFORNudge(),
      setIsShowing: useSetIsShowingWebFORNudge(),
    }),
    { wrapper: ({ children }: PropsWithChildren) => <WebFORNudgeProvider>{children}</WebFORNudgeProvider> },
  )
}

describe('WebFORNudgeProvider', () => {
  beforeEach(() => {
    mocks.isPortfolioZero = true
  })

  it('shows the nudge once requested while the gate is enabled', () => {
    const { result } = renderNudge()

    expect(result.current.isEnabled).toBe(true)
    expect(result.current.isShowing).toBe(false)

    act(() => result.current.setIsShowing(true))

    expect(result.current.isShowing).toBe(true)
  })

  it('hides the nudge when the gate turns off, e.g. after the account disconnects', () => {
    const { result, rerender } = renderNudge()
    act(() => result.current.setIsShowing(true))

    mocks.isPortfolioZero = false
    rerender()

    expect(result.current.isEnabled).toBe(false)
    expect(result.current.isShowing).toBe(false)
  })

  it('does not bring the nudge back when the gate turns on again', () => {
    const { result, rerender } = renderNudge()
    act(() => result.current.setIsShowing(true))

    mocks.isPortfolioZero = false
    rerender()
    mocks.isPortfolioZero = true
    rerender()

    expect(result.current.isEnabled).toBe(true)
    expect(result.current.isShowing).toBe(false)
  })
})

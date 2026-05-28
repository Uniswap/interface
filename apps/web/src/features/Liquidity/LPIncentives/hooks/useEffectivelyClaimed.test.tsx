import { renderHook } from '@testing-library/react'
import { useAtom } from 'jotai'
import { LP_INCENTIVES_CLAIM_STALENESS_MS } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { mocked } from '~/test-utils/mocked'

vi.mock('jotai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('jotai')>()),
  useAtom: vi.fn(),
}))

function mockLastClaimed(value: { timestamp: number; amount: string } | null): ReturnType<typeof vi.fn> {
  const setter = vi.fn()
  mocked(useAtom).mockReturnValue([value, setter] as unknown as ReturnType<typeof useAtom>)
  return setter
}

describe('useEffectivelyClaimed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLastClaimed(null)
  })

  it('returns false when hasCollectedRewards is false and there is no lastClaimed entry', () => {
    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: false }))

    expect(result.current).toBe(false)
  })

  it('returns true when hasCollectedRewards is true, regardless of lastClaimed or tokenRewards', () => {
    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: undefined, hasCollectedRewards: true }))

    expect(result.current).toBe(true)
  })

  it('returns true when hasCollectedRewards is true even when lastClaimed is stale and mismatched', () => {
    mockLastClaimed({ timestamp: Date.now() - LP_INCENTIVES_CLAIM_STALENESS_MS - 1000, amount: 'something-else' })

    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: true }))

    expect(result.current).toBe(true)
  })

  it('returns false when lastClaimed exists but tokenRewards is undefined', () => {
    mockLastClaimed({ timestamp: Date.now(), amount: '1000' })

    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: undefined, hasCollectedRewards: false }))

    expect(result.current).toBe(false)
  })

  it('returns true when lastClaimed is recent and amount matches tokenRewards', () => {
    mockLastClaimed({ timestamp: Date.now() - 60_000, amount: '1000' }) // 1 min ago

    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: false }))

    expect(result.current).toBe(true)
  })

  it('returns false when lastClaimed is older than the staleness window', () => {
    mockLastClaimed({ timestamp: Date.now() - LP_INCENTIVES_CLAIM_STALENESS_MS - 1000, amount: '1000' })

    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: false }))

    expect(result.current).toBe(false)
  })

  it('returns false when lastClaimed amount does not match the current tokenRewards', () => {
    mockLastClaimed({ timestamp: Date.now(), amount: '1000' })

    const { result } = renderHook(() => useEffectivelyClaimed({ tokenRewards: '2000', hasCollectedRewards: false }))

    expect(result.current).toBe(false)
  })

  it('clears lastClaimed when the entry is past the staleness window', () => {
    const setter = mockLastClaimed({
      timestamp: Date.now() - LP_INCENTIVES_CLAIM_STALENESS_MS - 1000,
      amount: '1000',
    })

    renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: false }))

    expect(setter).toHaveBeenCalledWith(null)
  })

  it('does not clear lastClaimed when the entry is within the staleness window', () => {
    const setter = mockLastClaimed({ timestamp: Date.now() - 60_000, amount: '1000' })

    renderHook(() => useEffectivelyClaimed({ tokenRewards: '1000', hasCollectedRewards: false }))

    expect(setter).not.toHaveBeenCalled()
  })
})

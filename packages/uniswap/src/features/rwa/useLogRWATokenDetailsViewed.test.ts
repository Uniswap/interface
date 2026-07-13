import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useFeatureFlag } from '@universe/gating'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useLogRWATokenDetailsViewed } from 'uniswap/src/features/rwa/useLogRWATokenDetailsViewed'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

const MAINNET_CHAIN_ID = 1
const TSLA_ADDRESS = '0xf6b1117ec07684D3958caD8BEb1b302bfD21103f'

function match({ category = RwaCategory.STOCKS, issuer = 'ondo' } = {}): RWAMatch {
  return {
    asset: { symbol: 'TSLA', name: 'Tesla', icon: 'icon.png', category, tokens: [] },
    token: {
      chainId: MAINNET_CHAIN_ID,
      address: TSLA_ADDRESS,
      issuer,
      name: 'Ondo',
      symbol: 'TSLA.on',
      logoUrl: 'logo.png',
    },
  }
}

describe(useLogRWATokenDetailsViewed, () => {
  const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock
  const mockUseFeatureFlag = vi.mocked(useFeatureFlag)

  beforeEach(() => {
    mockSendAnalyticsEvent.mockClear()
    mockUseFeatureFlag.mockReturnValue(false)
  })

  it('fires once with the resolved RWA properties, geogated reflecting the RwaGeoblocked gate', () => {
    mockUseFeatureFlag.mockReturnValue(true)
    renderHook(() =>
      useLogRWATokenDetailsViewed({
        rwaMatch: match(),
        tokenAddress: TSLA_ADDRESS,
        tokenSymbol: 'TSLA.on',
        chainId: MAINNET_CHAIN_ID,
      }),
    )

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.RWATokenDetailsViewed, {
      tokenAddress: TSLA_ADDRESS,
      tokenSymbol: 'TSLA.on',
      chainId: MAINNET_CHAIN_ID,
      stocks: true,
      issuer: 'ondo',
      geogated: true,
    })
  })

  it('sets geogated=false when the RwaGeoblocked gate is off', () => {
    renderHook(() =>
      useLogRWATokenDetailsViewed({
        rwaMatch: match(),
        tokenAddress: TSLA_ADDRESS,
        tokenSymbol: 'TSLA.on',
        chainId: MAINNET_CHAIN_ID,
      }),
    )

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      UniswapEventName.RWATokenDetailsViewed,
      expect.objectContaining({ geogated: false }),
    )
  })

  it('does not fire for a non-RWA token (no match)', () => {
    renderHook(() =>
      useLogRWATokenDetailsViewed({
        rwaMatch: undefined,
        tokenAddress: TSLA_ADDRESS,
        tokenSymbol: 'TSLA.on',
        chainId: MAINNET_CHAIN_ID,
      }),
    )

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('sets stocks=false when the matched RWA is not categorized as a stock', () => {
    renderHook(() =>
      useLogRWATokenDetailsViewed({
        rwaMatch: match({ category: RwaCategory.ETFS }),
        tokenAddress: TSLA_ADDRESS,
        tokenSymbol: 'TSLA.on',
        chainId: MAINNET_CHAIN_ID,
      }),
    )

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      UniswapEventName.RWATokenDetailsViewed,
      expect.objectContaining({ stocks: false }),
    )
  })

  it('does not re-fire on unrelated re-renders of the same token', () => {
    const { rerender } = renderHook(() =>
      useLogRWATokenDetailsViewed({
        rwaMatch: match(),
        tokenAddress: TSLA_ADDRESS,
        tokenSymbol: 'TSLA.on',
        chainId: MAINNET_CHAIN_ID,
      }),
    )

    rerender()
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })
})

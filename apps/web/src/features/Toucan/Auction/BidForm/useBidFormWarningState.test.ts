import { renderHook } from '@testing-library/react'
import { useFeatureFlag } from '@universe/gating'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { zeroAddress } from '~/chains'
import { useBidFormWarningState } from '~/features/Toucan/Auction/BidForm/useBidFormWarningState'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { TOUCAN_AUCTION_SUPPORTED_CHAINS } from '~/features/Toucan/supportedChains'
import { getPrimaryStablecoin } from '~/pages/Liquidity/CreateAuction/raiseCurrency'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

const ARBITRARY_TOKEN = '0x1234567890123456789012345678901234567890'

function getWarningState(chainId: UniverseChainId, currency: string): boolean {
  const { result } = renderHook(() =>
    useBidFormWarningState({
      chainId,
      currency,
      auctionProgressState: AuctionProgressState.IN_PROGRESS,
      userBids: [],
    }),
  )
  return result.current.shouldShowWarningBanner
}

describe('useBidFormWarningState', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
  })

  it('accepts the native currency (zero address)', () => {
    expect(getWarningState(UniverseChainId.Mainnet, zeroAddress)).toBe(false)
  })

  it('accepts the primary stablecoin on a USDC-keyed chain', () => {
    expect(getWarningState(UniverseChainId.Mainnet, getPrimaryStablecoin(UniverseChainId.Mainnet).address)).toBe(false)
  })

  it('accepts the primary stablecoin on a non-USDC-keyed chain (Robinhood/USDG)', () => {
    // Regression guard: Robinhood registers USDG, not a `tokens.USDC` key.
    expect(TOUCAN_AUCTION_SUPPORTED_CHAINS).toContain(UniverseChainId.Robinhood)
    expect(getChainInfo(UniverseChainId.Robinhood).tokens.USDC).toBeUndefined()
    expect(getWarningState(UniverseChainId.Robinhood, getPrimaryStablecoin(UniverseChainId.Robinhood).address)).toBe(
      false,
    )
  })

  it('rejects an arbitrary token on a USDC-keyed chain', () => {
    expect(getWarningState(UniverseChainId.Mainnet, ARBITRARY_TOKEN)).toBe(true)
  })

  it('rejects an arbitrary token on a non-USDC-keyed chain (Robinhood)', () => {
    expect(getWarningState(UniverseChainId.Robinhood, ARBITRARY_TOKEN)).toBe(true)
  })
})

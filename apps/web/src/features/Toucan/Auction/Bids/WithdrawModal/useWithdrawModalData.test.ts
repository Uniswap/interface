import { renderHook } from '@testing-library/react'
import { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWithdrawModalData } from '~/features/Toucan/Auction/Bids/WithdrawModal/useWithdrawModalData'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import {
  AuctionBidStatus,
  type AuctionDetails,
  AuctionOutcome,
  AuctionProgressState,
} from '~/features/Toucan/Auction/store/types'

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({ formatNumberOrString: ({ value }: { value: string }) => value }),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCPrice: () => ({}) }))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({
  useBidTokenInfo: () => ({ bidTokenInfo: { decimals: 0, symbol: 'BID', priceFiat: 1 } }),
}))
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: ReturnType<typeof store.getState>) => unknown) => selector(store.getState()),
}))

const store = createAuctionStore()
const TOKEN = new Token(UniverseChainId.Mainnet, '0x1111111111111111111111111111111111111111', 0, 'WHOLE', 'Whole')

describe('useWithdrawModalData zero-decimal tokens', () => {
  beforeEach(() => {
    const auction = new Auction({
      address: '0x2222222222222222222222222222222222222222',
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN.address,
      currency: '0x3333333333333333333333333333333333333333',
      floorPrice: (2n ** 96n).toString(),
    }) as AuctionDetails
    store.setState({
      auctionDetails: { ...auction, token: { currency: TOKEN, currencyId: 'whole', logoUrl: undefined } },
      progress: {
        ...store.getState().progress,
        state: AuctionProgressState.ENDED,
        outcome: AuctionOutcome.GRADUATED,
        isGraduated: true,
      },
      userBids: [
        {
          bidId: '1',
          auctionId: 'auction',
          walletId: 'wallet',
          txHash: 'tx',
          amount: '125',
          maxPrice: (2n ** 96n).toString(),
          createdAt: '2026-09-01T00:00:00Z',
          status: AuctionBidStatus.Submitted,
          baseTokenInitial: '500',
          currencySpent: '250',
        },
      ],
    })
  })

  it('formats whole auction tokens, returned bid tokens, and average cost without treating decimals as missing', () => {
    const { result } = renderHook(() => useWithdrawModalData({}))
    expect(result.current.auctionTokensToClaim).toBe(125n)
    expect(result.current.formattedAuctionTokens).toBe('125')
    expect(result.current.formattedBidTokens).toBe('250 BID')
    expect(result.current.averageCostPerToken).toBe('2')
    expect(result.current.bidTokenAmountUsd).toBe(250)
    expect(result.current.auctionTokenAmountUsd).toBe(125)
  })

  it('refunds all submitted budgets on a failed auction and excludes exited bids', () => {
    const bid = store.getState().userBids[0]!
    store.setState({
      progress: { ...store.getState().progress, outcome: AuctionOutcome.FAILED, isGraduated: false },
      userBids: [
        { ...bid, bidId: '1', baseTokenInitial: '1000', currencySpent: '0', amount: '0' },
        { ...bid, bidId: '2', baseTokenInitial: '2000', currencySpent: '0', amount: '0' },
        { ...bid, bidId: '3', baseTokenInitial: '700', status: AuctionBidStatus.Exited, amount: '0' },
      ],
    })
    const { result } = renderHook(() => useWithdrawModalData({}))
    expect(result.current.bidTokensToClaim).toBe(3000n)
    expect(result.current.formattedBidTokens).toBe('3000 BID')
    expect(result.current.auctionTokensToClaim).toBe(0n)
  })

  it('counts an omitted budget as zero instead of throwing during render', () => {
    const bid = store.getState().userBids[0]!
    store.setState({
      progress: { ...store.getState().progress, outcome: AuctionOutcome.FAILED, isGraduated: false },
      userBids: [
        { ...bid, bidId: '1', baseTokenInitial: '1000', currencySpent: '0', amount: '0' },
        { ...bid, bidId: '2', baseTokenInitial: '', currencySpent: '0', amount: '0' },
      ],
    })
    const { result } = renderHook(() => useWithdrawModalData({}))
    expect(result.current.bidTokensToClaim).toBe(1000n)
  })
})

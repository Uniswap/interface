import '~/test-utils/tokens/mocks'
import { UniverseChainId } from '@universe/chains'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { parseWithdrawBidAndClaimTokens } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseToucan'
import { mocked } from '~/test-utils/mocked'

describe('parseWithdrawBidAndClaimTokens', () => {
  it.each([
    { status: TransactionStatus.Pending, title: 'Claiming', descriptor: '1 USDC' },
    { status: TransactionStatus.Failed, title: 'Claim failed', descriptor: '1 USDC' },
    { status: TransactionStatus.Success, title: 'Claimed', descriptor: '1 USDC claimed' },
  ])('only describes tokens as claimed after success ($status)', async ({ status, title, descriptor }) => {
    const activity = await parseWithdrawBidAndClaimTokens({
      withdraw: {
        type: TransactionType.ToucanWithdrawBidAndClaimTokens,
        auctionContractAddress: '0x0000000000000000000000000000000000000001',
        auctionTokenAddress: USDC_MAINNET.address,
        auctionTokenAmountRaw: '1000000',
      },
      formatNumber: ({ value }) => String(value),
      chainId: UniverseChainId.Mainnet,
      status,
    })

    expect(activity).toMatchObject({ title, descriptor })
  })

  it.each([
    { status: TransactionStatus.Pending, title: 'Refunding', descriptor: '2 DAI' },
    { status: TransactionStatus.Failed, title: 'Failed to refund', descriptor: '2 DAI' },
    { status: TransactionStatus.Success, title: 'Refunded', descriptor: '2 DAI refunded' },
  ])('only describes a refund as refunded after success ($status)', async ({ status, title, descriptor }) => {
    const activity = await parseWithdrawBidAndClaimTokens({
      withdraw: {
        type: TransactionType.ToucanWithdrawBidAndClaimTokens,
        auctionContractAddress: '0x0000000000000000000000000000000000000001',
        auctionTokenAddress: USDC_MAINNET.address,
        bidTokenAddress: DAI.address,
        bidTokenAmountRaw: '2000000000000000000',
      },
      formatNumber: ({ value }) => String(value),
      chainId: UniverseChainId.Mainnet,
      status,
    })

    expect(activity).toMatchObject({ title, descriptor })
  })

  it.each([
    { status: TransactionStatus.Pending, descriptor: '2 DAI and 1 USDC' },
    { status: TransactionStatus.Failed, descriptor: '2 DAI and 1 USDC' },
    { status: TransactionStatus.Success, descriptor: '2 DAI withdrawn and 1 USDC claimed' },
  ])(
    'only describes a combined withdrawal and claim as settled after success ($status)',
    async ({ status, descriptor }) => {
      const activity = await parseWithdrawBidAndClaimTokens({
        withdraw: {
          type: TransactionType.ToucanWithdrawBidAndClaimTokens,
          auctionContractAddress: '0x0000000000000000000000000000000000000001',
          auctionTokenAddress: USDC_MAINNET.address,
          auctionTokenAmountRaw: '1000000',
          bidTokenAddress: DAI.address,
          bidTokenAmountRaw: '2000000000000000000',
        },
        formatNumber: ({ value }) => String(value),
        chainId: UniverseChainId.Mainnet,
        status,
      })

      expect(activity.descriptor).toBe(descriptor)
    },
  )

  it.each([
    { status: TransactionStatus.Pending, descriptor: 'Unknown' },
    { status: TransactionStatus.Failed, descriptor: 'Unknown' },
    { status: TransactionStatus.Success, descriptor: 'Unknown claimed' },
  ])('omits an unresolved symbol from the claim descriptor ($status)', async ({ status, descriptor }) => {
    mocked(fetchCurrency).mockResolvedValueOnce(undefined)

    const activity = await parseWithdrawBidAndClaimTokens({
      withdraw: {
        type: TransactionType.ToucanWithdrawBidAndClaimTokens,
        auctionContractAddress: '0x0000000000000000000000000000000000000001',
        auctionTokenAddress: '0x0000000000000000000000000000000000000002',
        auctionTokenAmountRaw: '1000000',
      },
      formatNumber: ({ value }) => String(value),
      chainId: UniverseChainId.Mainnet,
      status,
    })

    expect(activity.descriptor).toBe(descriptor)
  })
})

import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  AuctionLaunchTransactionInfo,
  ToucanBidTransactionInfo,
  ToucanWithdrawBidAndClaimTokensTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { getActivityTitle } from '~/components/AccountDrawer/MiniPortfolio/Activity/constants'
import { getCurrencyFromCurrencyId } from '~/components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export async function parseToucanBid({
  bid,
  formatNumber,
  chainId,
}: {
  bid: ToucanBidTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const bidCurrencyId =
    bid.bidTokenAddress === ZERO_ADDRESS
      ? buildNativeCurrencyId(chainId)
      : buildCurrencyId(chainId, bid.bidTokenAddress)
  const auctionCurrencyId = bid.auctionTokenAddress ? buildCurrencyId(chainId, bid.auctionTokenAddress) : undefined
  const [bidCurrency, auctionCurrency] = await Promise.all([
    getCurrencyFromCurrencyId(bidCurrencyId),
    auctionCurrencyId ? getCurrencyFromCurrencyId(auctionCurrencyId) : undefined,
  ])
  const auctionTokenSymbol = auctionCurrency?.symbol ?? bid.auctionTokenSymbol ?? bid.auctionContractAddress

  const formattedAmount =
    bidCurrency && bid.amountRaw
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(bidCurrency, bid.amountRaw).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : undefined

  return {
    descriptor:
      bidCurrency && formattedAmount
        ? i18n.t('activity.transaction.submitBid.descriptor', {
            amountWithSymbol: `${formattedAmount} ${bidCurrency.symbol}`,
            walletAddress: auctionTokenSymbol,
          })
        : i18n.t('common.unknown'),
    currencies: [bidCurrency],
  }
}

export function parseAuctionLaunch(launch: AuctionLaunchTransactionInfo): Partial<Activity> {
  const descriptor = launch.tokenName ?? launch.tokenSymbol ?? shortenAddress({ address: launch.predictedTokenAddress })

  return {
    descriptor,
    logos: [launch.tokenLogoUrl],
    fallbackSymbols: [launch.tokenSymbol],
  }
}

export async function parseWithdrawBidAndClaimTokens({
  withdraw,
  formatNumber,
  chainId,
  status,
}: {
  withdraw: ToucanWithdrawBidAndClaimTokensTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
  status: TransactionStatus
}): Promise<Partial<Activity>> {
  // Resolve currency objects from addresses
  const [auctionCurrency, bidCurrency] = await Promise.all([
    withdraw.auctionTokenAddress
      ? getCurrencyFromCurrencyId(buildCurrencyId(chainId, withdraw.auctionTokenAddress))
      : undefined,
    withdraw.bidTokenAddress
      ? getCurrencyFromCurrencyId(
          withdraw.bidTokenAddress === ZERO_ADDRESS
            ? buildNativeCurrencyId(chainId)
            : buildCurrencyId(chainId, withdraw.bidTokenAddress),
        )
      : undefined,
  ])

  const hasAuctionTokens = withdraw.auctionTokenAmountRaw && withdraw.auctionTokenAmountRaw !== '0'
  const hasBidTokens = withdraw.bidTokenAmountRaw && withdraw.bidTokenAmountRaw !== '0'

  // Build descriptor and title based on what's available
  let descriptor: string
  let title: string

  if (hasAuctionTokens && hasBidTokens) {
    // Both tokens - use the default withdraw bid title
    title = getActivityTitle({ type: TransactionType.ToucanWithdrawBidAndClaimTokens, status })
    const formattedBid = bidCurrency
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(bidCurrency, withdraw.bidTokenAmountRaw!).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')
    const formattedAuction = auctionCurrency
      ? formatNumber({
          value: parseFloat(
            CurrencyAmount.fromRawAmount(auctionCurrency, withdraw.auctionTokenAmountRaw!).toSignificant(),
          ),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')

    descriptor = i18n.t('activity.transaction.withdrawAndClaim.descriptor', {
      withdrawnAmount: `${formattedBid} ${bidCurrency?.symbol}`,
      claimedAmount: `${formattedAuction} ${auctionCurrency?.symbol}`,
    })
  } else if (hasBidTokens) {
    // Refund only - user bid but didn't win any tokens
    const formattedBid = bidCurrency
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(bidCurrency, withdraw.bidTokenAmountRaw!).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')

    // Use a status-aware title so a pending refund reads as a gerund ("Refunding")
    // rather than the past-tense "Refunded".
    title =
      status === TransactionStatus.Pending
        ? i18n.t('transaction.status.refund.pending')
        : status === TransactionStatus.Failed
          ? i18n.t('transaction.status.refund.failed')
          : i18n.t('transaction.status.refund.success')
    descriptor = i18n.t('activity.transaction.refund.descriptor', {
      amountWithSymbol: `${formattedBid} ${bidCurrency?.symbol ?? ''}`,
    })
  } else if (hasAuctionTokens) {
    // Only auction tokens - use claim title
    title = getActivityTitle({ type: TransactionType.AuctionClaimed, status })
    const formattedAuction = auctionCurrency
      ? formatNumber({
          value: parseFloat(
            CurrencyAmount.fromRawAmount(auctionCurrency, withdraw.auctionTokenAmountRaw!).toSignificant(),
          ),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')

    descriptor = i18n.t('activity.transaction.claim.descriptor', {
      amountWithSymbol: `${formattedAuction} ${auctionCurrency?.symbol}`,
    })
  } else {
    // Fallback for edge case
    title = getActivityTitle({ type: TransactionType.ToucanWithdrawBidAndClaimTokens, status })
    descriptor = i18n.t('common.unknown')
  }

  // Build currencies array with only non-undefined values
  const currencies = [bidCurrency, auctionCurrency].filter((c): c is Currency => c !== undefined)

  return {
    title,
    descriptor,
    currencies: currencies.length > 0 ? currencies : undefined,
  }
}

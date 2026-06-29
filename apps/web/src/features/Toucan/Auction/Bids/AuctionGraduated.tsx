import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { q96ToPriceString } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { AuctionGraduatedSkeleton } from '~/features/Toucan/Auction/Bids/AuctionGraduatedSkeleton'
import { AuctionRedeemable } from '~/features/Toucan/Auction/Bids/AuctionRedeemable'
import { GraduatedCardFrame } from '~/features/Toucan/Auction/Bids/GraduatedCardFrame'
import { useAuctionRedemption } from '~/features/Toucan/Auction/hooks/useAuctionRedemption'
import { useAuctionTokenInfo } from '~/features/Toucan/Auction/hooks/useAuctionTokenInfo'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useRedeemableBalance } from '~/features/Toucan/Auction/hooks/useRedeemableBalance'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { sumTokensReceived } from '~/features/Toucan/Auction/utils/tokensReceived'

const AuctionGraduatedSuccess = ({
  auctionLogoUrl,
  auctionCurrency,
  bidTokenCurrency,
  bidTokenPriceFiat,
  bidTokenSymbol,
  clearingPrice,
  chainId,
  claimBlock,
  currentBlockNumber,
}: {
  auctionLogoUrl: Maybe<string>
  auctionCurrency: Currency
  bidTokenCurrency: Currency
  bidTokenPriceFiat: number
  bidTokenSymbol: string
  clearingPrice: string
  chainId: number
  claimBlock: string | undefined
  currentBlockNumber: number | undefined
}) => {
  const { t } = useTranslation()
  const { userBids, tokenColor } = useAuctionStore((state) => ({
    userBids: state.userBids,
    tokenColor: state.tokenColor,
  }))
  const { formatNumberOrString } = useLocalizationContext()
  const auctionTokenDecimals = auctionCurrency.decimals
  const bidTokenDecimals = bidTokenCurrency.decimals
  // Check if we're in the withdrawal waiting period
  const isClaimPeriodNotOpen = useMemo(() => {
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [claimBlock, currentBlockNumber])

  // Calculate tokens received in raw units (auction token)
  const tokensReceived = useMemo(() => sumTokensReceived(userBids), [userBids])

  // Calculate currency spent in raw units (bid token)
  const currencySpent = useMemo(() => {
    return userBids.reduce((acc, bid) => {
      return acc + BigInt(bid.currencySpent)
    }, 0n)
  }, [userBids])

  // Format for display (keep as strings to avoid precision loss)
  const tokensReceivedDecimal = useMemo(() => {
    return formatUnits(tokensReceived, auctionTokenDecimals)
  }, [tokensReceived, auctionTokenDecimals])

  // Numeric value for SubscriptZeroPrice (average price per token)
  const currencySpentPerTokenNumeric = useMemo(() => {
    if (tokensReceived === 0n) {
      return 0
    }

    try {
      // Create CurrencyAmount objects from raw amounts
      const tokensReceivedAmount = CurrencyAmount.fromRawAmount(auctionCurrency, JSBI.BigInt(tokensReceived.toString()))
      const currencySpentAmount = CurrencyAmount.fromRawAmount(bidTokenCurrency, JSBI.BigInt(currencySpent.toString()))

      // Create Price: bidTokenCurrency per auctionToken
      const price = new Price(
        auctionCurrency,
        bidTokenCurrency,
        tokensReceivedAmount.quotient,
        currencySpentAmount.quotient,
      )

      return Number(price.toSignificant(18))
    } catch {
      return 0
    }
  }, [tokensReceived, currencySpent, auctionCurrency, bidTokenCurrency])

  // Calculate clearing price in decimal format
  const clearingPriceDecimal = useMemo(() => {
    return q96ToPriceString({
      q96Value: clearingPrice,
      bidTokenDecimals,
      auctionTokenDecimals,
    })
  }, [clearingPrice, bidTokenDecimals, auctionTokenDecimals])

  // Calculate currency spent per token using Uniswap SDK Price class
  // This handles division with different decimals automatically
  const currencySpentPerTokenDecimal = useMemo(() => {
    if (tokensReceived === 0n) {
      return '0'
    }

    try {
      // Create CurrencyAmount objects from raw amounts
      const tokensReceivedAmount = CurrencyAmount.fromRawAmount(auctionCurrency, JSBI.BigInt(tokensReceived.toString()))
      const currencySpentAmount = CurrencyAmount.fromRawAmount(bidTokenCurrency, JSBI.BigInt(currencySpent.toString()))

      // Create Price: bidTokenCurrency per auctionToken
      const price = new Price(
        auctionCurrency,
        bidTokenCurrency,
        tokensReceivedAmount.quotient,
        currencySpentAmount.quotient,
      )

      return price.toSignificant(18)
    } catch {
      return '0'
    }
  }, [tokensReceived, currencySpent, auctionCurrency, bidTokenCurrency])

  // Check if we have fiat price data available
  const hasPriceFiat = bidTokenPriceFiat > 0

  // Convert to numbers only for USD calculations (priceFiat is already a number)
  // These values are only meaningful when hasPriceFiat is true
  const clearingPriceUSD = useMemo(() => {
    if (!hasPriceFiat) {
      return 0
    }
    const price = Number(clearingPriceDecimal)
    return price * bidTokenPriceFiat
  }, [clearingPriceDecimal, bidTokenPriceFiat, hasPriceFiat])

  const currencySpentPerTokenUSD = useMemo(() => {
    if (!hasPriceFiat) {
      return 0
    }
    const price = Number(currencySpentPerTokenDecimal)
    return price * bidTokenPriceFiat
  }, [currencySpentPerTokenDecimal, bidTokenPriceFiat, hasPriceFiat])

  // Returns a decimal (0-1 range) for use with NumberType.Percentage formatter
  // Returns null when fiat price data is unavailable
  const clearingPriceToCurrencySpentPerTokenPercentDifference = useMemo(() => {
    if (!hasPriceFiat || clearingPriceUSD === 0) {
      return null
    }
    return (clearingPriceUSD - currencySpentPerTokenUSD) / clearingPriceUSD
  }, [clearingPriceUSD, currencySpentPerTokenUSD, hasPriceFiat])

  // The user's average price is always at or below clearing price
  const percentageColor = '$statusSuccess'

  return (
    <GraduatedCardFrame
      auctionLogoUrl={auctionLogoUrl}
      auctionSymbol={auctionCurrency.symbol}
      chainId={chainId}
      tokenColor={tokenColor}
    >
      {/* Top-anchored below the logo, with the same gaps as the redeem card (logo→label 34,
          then 6px between lines). */}
      <Flex flex={1} gap={6} width="100%" alignItems="center">
        <Text variant="body2" color="$neutral2" textAlign="center" mt={34}>
          {t('toucan.auction.youReceived')}
        </Text>
        <Flex row gap="$spacing8" alignItems="center">
          <Text color="$neutral1" variant="heading2">
            {formatNumberOrString({ value: tokensReceivedDecimal, type: NumberType.TokenNonTx })}
          </Text>
          <Text color="$neutral1" variant="heading2">
            {auctionCurrency.symbol}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing4">
          <SubscriptZeroPrice
            value={currencySpentPerTokenNumeric}
            symbol={bidTokenSymbol}
            minSignificantDigits={2}
            maxSignificantDigits={4}
            variant="body2"
            color="$neutral2"
          />
          <Text variant="body2" color="$neutral2">
            {t('toucan.auction.avgPrice')}
          </Text>
        </Flex>
        {clearingPriceToCurrencySpentPerTokenPercentDifference !== null && (
          <Flex row alignItems="center" justifyContent="center">
            <Text variant="body2" color="$neutral2">
              (
            </Text>
            <Text variant="body2" color={percentageColor}>
              {formatNumberOrString({
                value: Math.abs(clearingPriceToCurrencySpentPerTokenPercentDifference).toString(),
                type: NumberType.Percentage,
              })}
            </Text>
            <Text variant="body2" color="$neutral2">
              {' '}
              {t('toucan.auction.belowClearingPrice')})
            </Text>
          </Flex>
        )}
        {isClaimPeriodNotOpen && (
          <Flex mt="$spacing24" alignItems="center" justifyContent="center">
            <Text variant="body4" color="$neutral2" textAlign="center">
              {t('toucan.auction.withdrawalPeriodNotOpen')}
            </Text>
          </Flex>
        )}
      </Flex>
    </GraduatedCardFrame>
  )
}

// Orchestrates which graduated view to show (skeleton / redeem / success) from several data
// sources; the branching is inherent, matching TokenLaunchedBanner's data container.
// oxlint-disable-next-line complexity
export function AuctionGraduated() {
  const { auctionDetails, checkpointData, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const auctionToken = auctionDetails?.token
  const clearingPrice = getClearingPrice(checkpointData, auctionDetails)
  const auctionCurrency = auctionToken?.currency
  const auctionLogoUrl = auctionToken?.logoUrl

  const { isRedeemable, redeemUrl, realTokenAddress, loading: redemptionLoading } = useAuctionRedemption()

  // Live virtual-token (rCAP) balance of the connected wallet — the redeemable amount. It is 0
  // before the wallet claims from the auction and again after it redeems, and > 0 only while the
  // wallet holds the token; this drives whether the redeem card shows.
  const { balance: redeemableBalance, loading: redeemableBalanceLoading } = useRedeemableBalance({
    tokenAddress: auctionDetails?.tokenAddress,
    chainId: auctionDetails?.chainId,
    enabled: isRedeemable,
  })

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  // Get bid token Currency object
  const bidTokenCurrencyId = useMemo(
    () =>
      auctionDetails?.chainId && auctionDetails.currency
        ? buildCurrencyId(auctionDetails.chainId, auctionDetails.currency)
        : undefined,
    [auctionDetails?.chainId, auctionDetails?.currency],
  )
  const { currencyInfo: bidTokenCurrencyInfo } = useCurrencyInfoWithLoading(bidTokenCurrencyId)
  const bidTokenCurrency = bidTokenCurrencyInfo?.currency
  // priceFiat is 0 when price data is unavailable (e.g., testnets) - don't block on it
  const bidTokenPriceFiat = bidTokenInfo?.priceFiat ?? 0

  const bidTokenSymbol = bidTokenCurrency?.symbol

  // Real (redeemable) token info for the redeem card's symbol. useAuctionTokenInfo falls back to
  // an on-chain symbol read when the token isn't GraphQL-indexed, so the redeemable amount is
  // never mislabeled with the virtual token's symbol.
  const { tokenInfo: realTokenInfo, loading: realTokenLoading } = useAuctionTokenInfo(
    isRedeemable && realTokenAddress ? realTokenAddress : undefined,
    auctionDetails?.chainId,
  )

  // While still resolving redeemability or the wallet's balance, hold on the skeleton so we don't
  // flash the success card before the redeem card.
  if (isRedeemable && (redemptionLoading || redeemableBalanceLoading)) {
    return <AuctionGraduatedSkeleton />
  }

  // Redeem variant: the auctioned token is redeemable (override + on-chain underlying) AND the
  // wallet currently holds it. Before claim and after redeem the balance is 0, so this falls
  // through to the success card below.
  if (isRedeemable && redeemableBalance && redeemableBalance > 0n) {
    if (!auctionDetails || !auctionCurrency || !redeemUrl || !realTokenAddress || realTokenLoading) {
      return <AuctionGraduatedSkeleton />
    }
    return (
      <AuctionRedeemable
        auctionLogoUrl={auctionLogoUrl}
        auctionCurrency={auctionCurrency}
        chainId={auctionDetails.chainId}
        realTokenSymbol={realTokenInfo?.currency.symbol ?? ''}
        redeemableBalanceRaw={redeemableBalance}
        redeemUrl={redeemUrl}
      />
    )
  }

  if (!auctionDetails || !auctionCurrency || clearingPrice === '0' || !bidTokenCurrency || !bidTokenSymbol) {
    return <AuctionGraduatedSkeleton />
  }

  return (
    <AuctionGraduatedSuccess
      auctionLogoUrl={auctionLogoUrl}
      auctionCurrency={auctionCurrency}
      bidTokenCurrency={bidTokenCurrency}
      bidTokenPriceFiat={bidTokenPriceFiat}
      bidTokenSymbol={bidTokenSymbol}
      clearingPrice={clearingPrice}
      chainId={auctionDetails.chainId}
      claimBlock={auctionDetails.claimBlock}
      currentBlockNumber={currentBlockNumber}
    />
  )
}

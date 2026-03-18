import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from 'viem'
import { q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { WithdrawModal } from '~/components/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/components/Toucan/Auction/hooks/useWithdrawButtonState'
import { BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'
import '~/components/Toucan/Auction/Bids/AuctionGraduated.css'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useTokenLaunchedBannerColorData } from '~/components/Toucan/Auction/Banners/TokenLaunched/useTokenLaunchedBannerColorData'
import { AuctionGraduatedSkeleton } from '~/components/Toucan/Auction/Bids/AuctionGraduatedSkeleton'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'

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
  onSetActiveTab,
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
  onSetActiveTab: (tab: BidInfoTab) => void
}) => {
  const { t } = useTranslation()
  const { userBids, tokenColor } = useAuctionStore((state) => ({
    userBids: state.userBids,
    tokenColor: state.tokenColor,
  }))
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()
  const auctionTokenDecimals = auctionCurrency.decimals
  const bidTokenDecimals = bidTokenCurrency.decimals
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  // Get withdraw button state from shared hook
  const {
    label: withdrawLabel,
    isDisabled: isWithdrawDisabled,
    disabledTooltip,
  } = useWithdrawButtonState({
    isGraduated: true,
    claimBlock,
    currentBlockNumber,
    chainId,
  })

  // Check if we're in the withdrawal waiting period
  const isClaimPeriodNotOpen = useMemo(() => {
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [claimBlock, currentBlockNumber])

  const { bannerGradient } = useTokenLaunchedBannerColorData({
    tokenColor,
    colors,
    gradientLtr: false,
  })

  // Calculate tokens received in raw units (auction token)
  const tokensReceived = useMemo(() => {
    return userBids.reduce((acc, bid) => {
      return acc + BigInt(bid.amount)
    }, 0n)
  }, [userBids])

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
    <Flex gap="$spacing8" width="100%">
      {/* Main congratulations card */}
      <Flex
        position="relative"
        overflow="hidden"
        borderRadius="$rounded24"
        borderWidth={1}
        borderColor="$surface3"
        backgroundColor="$surface1"
        minHeight={344}
        width="100%"
        justifyContent="center"
        alignItems="center"
        style={bannerGradient}
      >
        {/* Floating token logos with blur */}
        <Flex
          position="absolute"
          left={319}
          top={238}
          opacity={0.54}
          style={{ filter: 'blur(3px)', animation: 'float1 8s ease-in-out infinite' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={58} />
        </Flex>
        <Flex
          position="absolute"
          left={65.5}
          top={-3.95}
          opacity={0.3}
          style={{ filter: 'blur(8px)', animation: 'float2 10s ease-in-out infinite 1s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={45} />
        </Flex>
        <Flex
          position="absolute"
          left={336.47}
          top={128.15}
          opacity={0.3}
          style={{ filter: 'blur(8px)', animation: 'float3 9s ease-in-out infinite 2s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={45} />
        </Flex>
        <Flex
          position="absolute"
          left={280.02}
          top={-15.24}
          opacity={0.54}
          style={{ filter: 'blur(4px)', animation: 'float4 11s ease-in-out infinite 0.5s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={56} />
        </Flex>
        <Flex
          position="absolute"
          left={-16.92}
          top={165.41}
          opacity={0.54}
          style={{ filter: 'blur(4px)', animation: 'float5 7s ease-in-out infinite 1.5s' }}
        >
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={56} />
        </Flex>

        {/* Bottom glow effect */}
        <Flex
          position="absolute"
          bottom={-251}
          left="50%"
          width={299}
          height={299}
          borderRadius={999}
          backgroundColor="#7482ff"
          opacity={0.3}
          style={{ transform: 'translateX(-50%)', filter: 'blur(100px)' }}
        />

        {/* Token logo */}
        <Flex position="absolute" left="calc(50% - 32px)" top={56}>
          <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionCurrency.symbol} size={64} />
        </Flex>

        {/* Text content */}
        <Flex gap="$spacing8" alignItems="center" justifyContent="center" width="100%" px="$spacing20">
          <Text variant="body2" color="$neutral2" textAlign="center" mt={100}>
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
      </Flex>

      <Button
        flex={1}
        size="medium"
        emphasis="secondary"
        variant="default"
        onPress={() => onSetActiveTab(BidInfoTab.MY_BIDS)}
      >
        <Button.Text color="$neutral1">{t('toucan.auction.viewMyBids')}</Button.Text>
      </Button>
      {/* Hide on $lg and below - mobile uses AuctionChartContainer inline button or ToucanToken fixed button */}
      <Flex display="flex" $lg={{ display: 'none' }}>
        <ToucanActionButton
          elementName={ElementName.AuctionWithdrawTokensButton}
          label={withdrawLabel}
          onPress={() => setIsWithdrawModalOpen(true)}
          isDisabled={isWithdrawDisabled}
          disabledTooltip={isWithdrawDisabled ? disabledTooltip : undefined}
        />
      </Flex>
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </Flex>
  )
}

export function AuctionGraduated({ onSetActiveTab }: { onSetActiveTab: (tab: BidInfoTab) => void }) {
  const { auctionDetails, checkpointData, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    currentBlockNumber: state.currentBlockNumber,
  }))
  const auctionToken = auctionDetails?.token
  const clearingPrice = getClearingPrice(checkpointData, auctionDetails)
  const auctionCurrency = auctionToken?.currency
  const auctionLogoUrl = auctionToken?.logoUrl

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
      onSetActiveTab={onSetActiveTab}
    />
  )
}

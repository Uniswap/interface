import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Skeleton, Text, styled, useMedia } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { useStatsBannerData } from '~/features/Toucan/Auction/hooks/useStatsBannerData'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'

/** Tabular figures so the live countdown doesn't jitter as digits change. */
const MONOSPACE_NUMERIC_STYLE = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: "'tnum' 1",
} as const

const Divider = styled(Flex, {
  width: 1,
  alignSelf: 'stretch',
  backgroundColor: '$surface3',
  $lg: {
    display: 'none',
  },
})

function StatCellSkeleton() {
  return (
    <Skeleton>
      <Flex width={96} height={24} borderRadius="$rounded4" backgroundColor="$surface3" />
    </Skeleton>
  )
}

/** Remounts on value change so data updates fade in; nothing pulses between updates. */
function FadeOnUpdate({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Flex key={value} animation="200ms" enterStyle={{ opacity: 0 }}>
      {children}
    </Flex>
  )
}

function StatCell({
  label,
  hasData,
  children,
  $lg,
}: {
  label: string
  hasData: boolean
  children: React.ReactNode
  $lg?: FlexProps['$lg']
}) {
  const media = useMedia()
  return (
    <Flex flex={1} flexDirection="column" gap="$spacing2" minWidth={0} $lg={$lg}>
      <Text variant={media.lg ? 'body3' : 'body2'} color="$neutral2">
        {label}
      </Text>
      {hasData ? children : <StatCellSkeleton />}
    </Flex>
  )
}

/**
 * QuickLaunch: the quick-launch detail stat row, rendered in place of the standard stats
 * banner (gated upstream). Display-only — every value comes from existing store selectors.
 * "Bids" not "Bidders": the checkpoints only carry totalBidCount.
 */
export function QuickLaunchStatsRow() {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const media = useMedia()

  const { auctionDetails, auctionProgressState, checkpointData, onchainCheckpoint } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    auctionProgressState: state.progress.state,
    checkpointData: state.checkpointData,
    onchainCheckpoint: state.onchainCheckpoint,
  }))

  const { bidTokenInfo, currentValuationFormatted, currentValuationFiatFormatted, currencyRaisedFormatted, hasData } =
    useStatsBannerData()

  const isAuctionActive = auctionProgressState === AuctionProgressState.IN_PROGRESS
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const isAuctionNotStarted = auctionProgressState === AuctionProgressState.NOT_STARTED

  const endBlockNum = auctionDetails?.endBlock ? Number(auctionDetails.endBlock) : undefined
  const startBlockNum = auctionDetails?.startBlock ? Number(auctionDetails.startBlock) : undefined
  const countdownTargetBlock = isAuctionNotStarted ? startBlockNum : endBlockNum
  const durationRemaining = useDurationRemaining(auctionDetails?.chainId, countdownTargetBlock)

  // Floor FDV (the auction's lowest possible launch valuation) as subtext under the clearing FDV.
  const floorFdvFormatted = useMemo(() => {
    const floorPriceQ96 = auctionDetails?.floorPrice
    const totalSupplyRaw = auctionDetails?.tokenTotalSupply || auctionDetails?.totalSupply
    if (!floorPriceQ96 || !totalSupplyRaw || !bidTokenInfo) {
      return undefined
    }
    const auctionTokenDecimals = auctionDetails.token?.currency.decimals ?? 18
    const floorPriceDecimal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: floorPriceQ96,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
    let supplyTokens: number
    try {
      supplyTokens = approximateNumberFromRaw({
        raw: BigInt(totalSupplyRaw),
        decimals: auctionTokenDecimals,
        significantDigits: 15,
      })
    } catch {
      return undefined
    }
    const floorValuationBidToken = floorPriceDecimal * supplyTokens
    if (!bidTokenInfo.priceFiat) {
      const tokenFormatted = formatNumberOrString({
        value: floorValuationBidToken.toString(),
        type: NumberType.TokenQuantityStats,
      })
      return `${tokenFormatted} ${bidTokenInfo.symbol}`
    }
    return convertFiatAmountFormatted(floorValuationBidToken * bidTokenInfo.priceFiat, NumberType.FiatTokenStats)
  }, [auctionDetails, bidTokenInfo, convertFiatAmountFormatted, formatNumberOrString])

  // Bid count from the same effective checkpoint the stats banner reads (on-chain while live,
  // final simulated checkpoint once ended).
  const effectiveCheckpoint = isAuctionActive ? onchainCheckpoint : checkpointData
  const bidCount = effectiveCheckpoint?.totalBidCount

  const timeRemainingLabel = isAuctionNotStarted
    ? t('toucan.auction.status.startingSoon')
    : t('toucan.auction.stats.timeRemaining')
  const timeRemainingValue = isAuctionEnded ? t('toucan.auction.timeRemaining.completed') : (durationRemaining ?? '--')

  const valuationPrimary =
    currentValuationFiatFormatted !== '--' ? currentValuationFiatFormatted : currentValuationFormatted
  const raisedValue = currencyRaisedFormatted ?? '--'
  const bidCountValue = bidCount !== undefined ? bidCount.toLocaleString() : '--'

  const primaryVariant = media.lg ? 'subheading1' : 'heading3'

  return (
    <Flex
      row
      width="100%"
      gap="$spacing20"
      alignItems="flex-start"
      py="$spacing4"
      mt="$spacing24"
      mb="$spacing12"
      $lg={{
        py: '$none',
        gap: '$spacing12',
        '$platform-web': {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'stretch',
        },
      }}
    >
      <StatCell label={timeRemainingLabel} hasData={hasData}>
        <Text variant={primaryVariant} color="$neutral1" style={MONOSPACE_NUMERIC_STYLE}>
          {timeRemainingValue}
        </Text>
      </StatCell>

      <Divider />

      <StatCell
        label={isAuctionEnded ? t('toucan.auction.fdvAtLaunch') : t('toucan.statsBanner.currentValuation')}
        hasData={hasData}
      >
        <FadeOnUpdate value={valuationPrimary}>
          <Text variant={primaryVariant} color="$neutral1">
            {valuationPrimary}
          </Text>
        </FadeOnUpdate>
        {floorFdvFormatted && (
          <Text variant={media.lg ? 'body4' : 'body3'} color="$neutral2">
            {t('toucan.auction.stats.floorFdv', { floorFdv: floorFdvFormatted })}
          </Text>
        )}
      </StatCell>

      <Divider />

      <StatCell label={t('toucan.auction.stats.totalRaised')} hasData={hasData}>
        <FadeOnUpdate value={raisedValue}>
          <Text variant={primaryVariant} color="$neutral1">
            {raisedValue}
          </Text>
        </FadeOnUpdate>
      </StatCell>

      <Divider />

      <StatCell label={t('toucan.auction.stats.bids')} hasData={hasData}>
        <FadeOnUpdate value={bidCountValue}>
          <Text variant={primaryVariant} color="$neutral1">
            {bidCountValue}
          </Text>
        </FadeOnUpdate>
      </StatCell>
    </Flex>
  )
}

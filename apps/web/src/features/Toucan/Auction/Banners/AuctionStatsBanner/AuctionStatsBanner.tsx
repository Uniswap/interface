import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, FlexProps, Skeleton, styled, Text, TextProps, Tooltip, useMedia } from 'ui/src'
import { ArrowChange } from 'ui/src/components/icons/ArrowChange'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { CommittedVolumeTooltipContent } from '~/features/Toucan/Auction/Banners/AuctionStatsBanner/CommittedVolumeTooltipContent'
import { useStatsBannerData } from '~/features/Toucan/Auction/hooks/useStatsBannerData'

const Divider = styled(Flex, {
  width: 1,
  alignSelf: 'stretch',
  backgroundColor: '$surface3',
  $lg: {
    display: 'none',
  },
})

interface StatCellProps {
  label: string
  hasData: boolean
  children: React.ReactNode
  $lg?: FlexProps['$lg']
}

function StatCellSkeleton() {
  return (
    <Flex gap="$spacing4">
      <Skeleton>
        <Flex width={123} height={18} borderRadius="$rounded4" backgroundColor="$surface3" />
      </Skeleton>
      <Skeleton>
        <Flex width={61} height={8} borderRadius="$rounded4" backgroundColor="$surface3" />
      </Skeleton>
    </Flex>
  )
}

function StatCell({ label, hasData, children, $lg }: StatCellProps) {
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

function useStatCellTitleVariant(): TextProps['variant'] {
  const media = useMedia()
  return media.xs ? 'body4' : media.sm ? 'body2' : media.xl ? 'subheading1' : 'heading3'
}

function StatPrimaryText({ children, color = '$neutral1' }: { children: React.ReactNode; color?: ColorTokens }) {
  const statCellTitleVariant = useStatCellTitleVariant()
  return (
    <Text variant={statCellTitleVariant} color={color}>
      {children}
    </Text>
  )
}

// Helper for secondary text values (body3 on mobile, body4 on lg)
function StatSecondaryText({ children, color = '$neutral2' }: { children: React.ReactNode; color?: ColorTokens }) {
  const media = useMedia()
  return (
    <Text variant={media.lg ? 'body4' : 'body3'} color={color}>
      {children}
    </Text>
  )
}

// Threshold for using subscript notation (number of leading zeros after decimal)
const SUBSCRIPT_THRESHOLD = 4

interface PriceChangeIndicatorProps {
  changePercent: number
  changeLabel: 'pastHour' | 'aboveFloor'
  isPositiveChange: boolean
  changePercentFormatted: string | null
}

function PriceChangeIndicator({
  changePercent,
  changeLabel,
  isPositiveChange,
  changePercentFormatted,
}: PriceChangeIndicatorProps) {
  const { t } = useTranslation()
  const media = useMedia()

  const arrowSize = media.lg ? 10 : 16
  const showArrow = changeLabel === 'aboveFloor' || changePercent !== 0
  const isZeroPastHour = changeLabel === 'pastHour' && changePercent === 0

  const textColor: ColorTokens = isZeroPastHour ? '$neutral2' : isPositiveChange ? '$statusSuccess' : '$statusCritical'
  const suffix = changeLabel === 'pastHour' ? t('toucan.statsBanner.pastHour') : t('toucan.statsBanner.aboveFloor')

  return (
    <Flex row alignItems="center" gap="$spacing2">
      {showArrow &&
        (isPositiveChange ? (
          <ArrowChange color="$statusSuccess" rotate="180deg" size={arrowSize} />
        ) : (
          <ArrowChange color="$statusCritical" size={arrowSize} />
        ))}
      <StatSecondaryText color={textColor}>
        {changePercentFormatted} {!media.xl && suffix}
      </StatSecondaryText>
    </Flex>
  )
}

interface ConcentrationDisplayProps {
  concentrationStartDecimal: number | null
  concentrationEndDecimal: number | null
  concentrationStartFiatValue: number | null
  concentrationEndFiatValue: number | null
  bidTokenSymbol: string | null
  currencySymbol: string
  statCellTitleVariant: TextProps['variant']
}

function ConcentrationDisplay({
  concentrationStartDecimal,
  concentrationEndDecimal,
  concentrationStartFiatValue,
  concentrationEndFiatValue,
  bidTokenSymbol,
  currencySymbol,
  statCellTitleVariant,
}: ConcentrationDisplayProps) {
  const media = useMedia()

  if (concentrationStartDecimal === null || concentrationEndDecimal === null) {
    return <StatPrimaryText>--</StatPrimaryText>
  }

  return (
    <>
      <Flex row alignItems="center" gap="$spacing4">
        <SubscriptZeroPrice
          value={concentrationStartDecimal}
          symbol={bidTokenSymbol ?? undefined}
          variant={statCellTitleVariant}
          color="$neutral1"
          minSignificantDigits={2}
          maxSignificantDigits={2}
          subscriptThreshold={SUBSCRIPT_THRESHOLD}
        />
        <StatPrimaryText color="$neutral3">–</StatPrimaryText>
        <SubscriptZeroPrice
          value={concentrationEndDecimal}
          symbol={bidTokenSymbol ?? undefined}
          variant={statCellTitleVariant}
          color="$neutral1"
          minSignificantDigits={2}
          maxSignificantDigits={2}
          subscriptThreshold={SUBSCRIPT_THRESHOLD}
        />
      </Flex>
      {concentrationStartFiatValue !== null && concentrationEndFiatValue !== null && (
        <Flex row alignItems="center" gap="$spacing4">
          <SubscriptZeroPrice
            value={concentrationStartFiatValue}
            prefix={currencySymbol}
            variant={media.lg ? 'body4' : 'body3'}
            color="$neutral2"
            minSignificantDigits={2}
            maxSignificantDigits={4}
            subscriptThreshold={SUBSCRIPT_THRESHOLD}
          />
          <StatSecondaryText>–</StatSecondaryText>
          <SubscriptZeroPrice
            value={concentrationEndFiatValue}
            prefix={currencySymbol}
            variant={media.lg ? 'body4' : 'body3'}
            color="$neutral2"
            minSignificantDigits={2}
            maxSignificantDigits={4}
            subscriptThreshold={SUBSCRIPT_THRESHOLD}
          />
        </Flex>
      )}
    </>
  )
}

export function AuctionStatsBanner() {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString } = useLocalizationContext()
  const { symbol: currencySymbol } = useAppFiatCurrencyInfo()
  const statCellTitleVariant = useStatCellTitleVariant()
  const media = useMedia()

  const {
    clearingPriceDecimal,
    clearingPriceFiatValue,
    changePercent,
    isPositiveChange,
    changeLabel,
    bidTokenSymbol,
    currentValuationFormatted,
    currentValuationFiatFormatted,
    concentrationStartDecimal,
    concentrationEndDecimal,
    concentrationStartFiatValue,
    concentrationEndFiatValue,
    totalBidVolumeFormatted,
    totalBidVolumeFiatFormatted,
    committedVolumeBreakdown,
    isLowVolumeHighFdv,
    hasData,
    isAuctionEnded,
    isAuctionNotStarted,
  } = useStatsBannerData()

  const showChangePercent = changePercent !== null && (changeLabel === 'pastHour' || changePercent > 0)

  // Committed volume headline excludes cancelled / out-of-range capital (filled + in-range outstanding).
  // Falls back to the raw total when the breakdown isn't yet available.
  const committedHeadlineFiat = committedVolumeBreakdown?.committedFiatFormatted ?? totalBidVolumeFiatFormatted
  const committedHeadlineToken = committedVolumeBreakdown?.committedFormatted ?? totalBidVolumeFormatted

  // Format the change percent using compact notation for large values (e.g., "24.3T%" instead of "24,309,849,856,032.78%")
  const changePercentFormatted = (() => {
    if (changePercent === null) {
      return null
    }
    const abs = Math.abs(changePercent)
    if (abs >= 1_000_000) {
      return '1M+%'
    }
    if (abs >= 1000) {
      return `${formatNumberOrString({ value: abs, type: NumberType.TokenQuantityStats })}%`
    }
    return formatPercent(abs)
  })()

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
        gap: 0,
        '$platform-web': {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'stretch',
        },
      }}
    >
      {/* Cell 1: Current clearing price */}
      <StatCell
        label={isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.statsBanner.clearingPrice')}
        hasData={hasData}
        $lg={{
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: '$surface3',
          pb: '$spacing12',
          pr: '$spacing12',
        }}
      >
        <Flex row alignItems="center" gap="$spacing4">
          <SubscriptZeroPrice
            value={clearingPriceDecimal}
            symbol={bidTokenSymbol ?? undefined}
            variant={statCellTitleVariant}
            color="$neutral1"
            minSignificantDigits={2}
            maxSignificantDigits={3}
            subscriptThreshold={SUBSCRIPT_THRESHOLD}
          />
          {showChangePercent && (
            <PriceChangeIndicator
              changePercent={changePercent}
              changeLabel={changeLabel}
              isPositiveChange={isPositiveChange}
              changePercentFormatted={changePercentFormatted}
            />
          )}
        </Flex>
        {clearingPriceFiatValue !== null && (
          <SubscriptZeroPrice
            value={clearingPriceFiatValue}
            prefix={currencySymbol}
            variant={media.lg ? 'body4' : 'body3'}
            color="$neutral2"
            minSignificantDigits={2}
            maxSignificantDigits={4}
            subscriptThreshold={SUBSCRIPT_THRESHOLD}
          />
        )}
      </StatCell>

      <Divider />

      {/* Cell 2: Current valuation */}
      <StatCell
        label={isAuctionEnded ? t('toucan.auction.fdvAtLaunch') : t('toucan.statsBanner.currentValuation')}
        hasData={hasData}
        $lg={{
          borderBottomWidth: 1,
          borderColor: '$surface3',
          pb: '$spacing12',
          pl: '$spacing12',
        }}
      >
        <StatPrimaryText>{currentValuationFormatted}</StatPrimaryText>
        <StatSecondaryText>{currentValuationFiatFormatted}</StatSecondaryText>
      </StatCell>

      <Divider />

      {/* Cell 3: Committed Volume */}
      <StatCell
        label={t('toucan.auction.committedVolume')}
        hasData={hasData}
        $lg={{
          borderRightWidth: 1,
          borderColor: '$surface3',
          pt: '$spacing12',
          pr: '$spacing12',
        }}
      >
        {committedVolumeBreakdown ? (
          <Tooltip placement="top" delay={75} offset={{ mainAxis: 8 }}>
            <Tooltip.Trigger>
              <Flex cursor="pointer">
                <StatPrimaryText>{committedHeadlineFiat ?? committedHeadlineToken ?? '--'}</StatPrimaryText>
                {!isAuctionNotStarted && committedHeadlineFiat && (
                  <StatSecondaryText>{committedHeadlineToken}</StatSecondaryText>
                )}
              </Flex>
            </Tooltip.Trigger>
            <Tooltip.Content
              backgroundColor="$surface1"
              borderRadius="$rounded12"
              borderWidth="$spacing1"
              borderColor="$surface3"
              py="$spacing8"
              px="$spacing12"
            >
              <CommittedVolumeTooltipContent
                total={committedVolumeBreakdown.totalFiatFormatted ?? committedVolumeBreakdown.totalFormatted}
                required={
                  committedVolumeBreakdown.requiredRaw !== null && committedVolumeBreakdown.requiredRaw > 0n
                    ? (committedVolumeBreakdown.requiredFiatFormatted ?? committedVolumeBreakdown.requiredFormatted)
                    : undefined
                }
                distribution={{
                  filled: committedVolumeBreakdown.filledFiatFormatted ?? committedVolumeBreakdown.filledFormatted,
                  inRange:
                    committedVolumeBreakdown.inRangeOutstandingFiatFormatted ??
                    committedVolumeBreakdown.inRangeOutstandingFormatted,
                  outOfRange:
                    committedVolumeBreakdown.outOfRangeFiatFormatted ?? committedVolumeBreakdown.outOfRangeFormatted,
                }}
                showLowVolumeHighFdv={isLowVolumeHighFdv}
              />
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Flex>
            <StatPrimaryText>{committedHeadlineFiat ?? committedHeadlineToken ?? '--'}</StatPrimaryText>
            {!isAuctionNotStarted && committedHeadlineFiat && (
              <StatSecondaryText>{committedHeadlineToken}</StatSecondaryText>
            )}
          </Flex>
        )}
      </StatCell>

      <Divider />

      {/* Cell 4: Bids concentrated at */}
      <StatCell
        label={t('toucan.statsBanner.bidsConcentratedAt')}
        hasData={hasData}
        $lg={{ pt: '$spacing12', pl: '$spacing12' }}
      >
        <ConcentrationDisplay
          concentrationStartDecimal={concentrationStartDecimal}
          concentrationEndDecimal={concentrationEndDecimal}
          concentrationStartFiatValue={concentrationStartFiatValue}
          concentrationEndFiatValue={concentrationEndFiatValue}
          bidTokenSymbol={bidTokenSymbol}
          currencySymbol={currencySymbol}
          statCellTitleVariant={statCellTitleVariant}
        />
      </StatCell>
    </Flex>
  )
}

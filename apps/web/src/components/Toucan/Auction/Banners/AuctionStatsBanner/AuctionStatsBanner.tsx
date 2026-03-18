import { useTranslation } from 'react-i18next'
import {
  ColorTokens,
  Flex,
  FlexProps,
  Skeleton,
  styled,
  Text,
  TextProps,
  Tooltip,
  useMedia,
  useSporeColors,
} from 'ui/src'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ArrowChangeDown } from '~/components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from '~/components/Icons/ArrowChangeUp'
import { useStatsBannerData } from '~/components/Toucan/Auction/hooks/useStatsBannerData'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'

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

export function AuctionStatsBanner() {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatPercent } = useLocalizationContext()
  const { symbol: currencySymbol } = useAppFiatCurrencyInfo()
  const statCellTitleVariant = useStatCellTitleVariant()
  const media = useMedia()

  const {
    clearingPriceDecimal,
    clearingPriceFiatValue,
    changePercent,
    isPositiveChange,
    bidTokenSymbol,
    currentValuationFormatted,
    currentValuationFiatFormatted,
    concentrationStartDecimal,
    concentrationEndDecimal,
    concentrationStartFiatValue,
    concentrationEndFiatValue,
    totalBidVolumeFormatted,
    totalBidVolumeFiatFormatted,
    currencyRaisedFormatted,
    requiredCurrencyFormatted,
    hasData,
    isAuctionEnded,
    isAuctionNotStarted,
  } = useStatsBannerData()

  const arrowColor = isPositiveChange ? colors.statusSuccess.val : colors.statusCritical.val
  const arrowSize = media.lg ? 10 : 16
  const showChangePercent = changePercent !== null && changePercent > 0

  // Format the change percent (formatPercent expects a raw percentage like 36 for 36%)
  const changePercentFormatted = changePercent !== null ? formatPercent(changePercent) : null

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
        '$platform-web': {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        },
      }}
    >
      {/* Cell 1: Current clearing price */}
      <StatCell
        label={isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.statsBanner.clearingPrice')}
        hasData={hasData}
        $lg={{
          borderBottomWidth: 1,
          borderRightWidth: 1,
          borderColor: '$surface3',
          pb: '$spacing16',
          pr: '$spacing16',
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
            <Flex row alignItems="center" gap="$spacing2">
              {isPositiveChange ? (
                <ArrowChangeUp width={arrowSize} height={arrowSize} color={arrowColor} />
              ) : (
                <ArrowChangeDown width={arrowSize} height={arrowSize} color={arrowColor} />
              )}
              <StatSecondaryText color={isPositiveChange ? '$statusSuccess' : '$statusCritical'}>
                {changePercentFormatted} {!media.xl && t('toucan.statsBanner.aboveFloor')}
              </StatSecondaryText>
            </Flex>
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
          pb: '$spacing16',
          pl: '$spacing16',
        }}
      >
        <StatPrimaryText>{currentValuationFormatted}</StatPrimaryText>
        <StatSecondaryText>{currentValuationFiatFormatted}</StatSecondaryText>
      </StatCell>

      <Divider />

      {/* Cell 3: Bids concentrated at */}
      <StatCell
        label={t('toucan.statsBanner.bidsConcentratedAt')}
        hasData={hasData}
        $lg={{
          borderRightWidth: 1,
          borderColor: '$surface3',
          pr: '$spacing16',
          pt: '$spacing16',
        }}
      >
        {concentrationStartDecimal !== null && concentrationEndDecimal !== null ? (
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
        ) : (
          <StatPrimaryText>--</StatPrimaryText>
        )}
      </StatCell>

      <Divider />

      {/* Cell 4: Committed Volume */}
      <StatCell
        label={t('toucan.auction.committedVolume')}
        hasData={hasData}
        $lg={{ pl: '$spacing16', pt: '$spacing16' }}
      >
        <Tooltip placement="top" delay={75} offset={{ mainAxis: 8 }}>
          <Tooltip.Trigger>
            <Flex cursor="pointer">
              <StatPrimaryText>{totalBidVolumeFiatFormatted ?? totalBidVolumeFormatted ?? '--'}</StatPrimaryText>
              {!isAuctionNotStarted && totalBidVolumeFiatFormatted && (
                <StatSecondaryText>{totalBidVolumeFormatted}</StatSecondaryText>
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
            zIndex="$tooltip"
          >
            <Flex gap="$spacing4">
              <Flex row justifyContent="space-between" gap="$spacing12">
                <Text variant="body4" color="$neutral2">
                  {t('toucan.statsBanner.totalCurrencyRaised')}
                </Text>
                <Text variant="body4" color="$neutral1">
                  {currencyRaisedFormatted ?? '--'}
                </Text>
              </Flex>
              {requiredCurrencyFormatted && (
                <Text variant="body4" color="$neutral2">
                  {t('toucan.statsBanner.requiredCurrency', {
                    amount: requiredCurrencyFormatted,
                  })}
                </Text>
              )}
            </Flex>
          </Tooltip.Content>
        </Tooltip>
      </StatCell>
    </Flex>
  )
}

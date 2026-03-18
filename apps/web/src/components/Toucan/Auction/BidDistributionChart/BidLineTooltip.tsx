import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { BID_LINE } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { useConcentrationColor } from '~/components/Toucan/Auction/BidDistributionChart/hooks/useConcentrationColor'
import { TooltipContainer } from '~/components/Toucan/Shared/TooltipContainer'

interface BidLineTooltipProps {
  left: number
  top: number
  isVisible: boolean
  volumeAtTick: number
  volumePercent: number
  connectedWalletAddress?: string
  /** When true, tooltip should appear to the left of the bid line instead of right */
  flipLeft?: boolean
}

/**
 * React component for the bid line tooltip that shows when user has entered a bid.
 * Always visible (not just on hover) when bid is within visible chart range.
 * Shows: AccountIcon avatar + "Your bid", bid volume in fiat, volume percentage
 */
export const BidLineTooltip = forwardRef<HTMLDivElement, BidLineTooltipProps>(function BidLineTooltip(
  { left, top, isVisible, volumeAtTick, volumePercent, connectedWalletAddress, flipLeft },
  ref,
) {
  const { t } = useTranslation()
  const concentrationColor = useConcentrationColor()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { symbol: currencySymbol } = useAppFiatCurrencyInfo()

  if (!isVisible) {
    return null
  }

  // Format volume in user's selected fiat currency with T/M/B suffix
  const formattedVolume =
    volumeAtTick === 0 ? `${currencySymbol}0.00` : convertFiatAmountFormatted(volumeAtTick, NumberType.FiatTokenStats)

  // Format percentage with appropriate precision
  const precision = volumePercent >= 10 ? 0 : 1
  const volumePercentDisplay = t('toucan.bidDistribution.percentOfVolume', {
    percent: volumePercent.toFixed(precision),
  })

  // Apply flip transform regardless of stacking - stacking only affects vertical position
  const shouldFlip = Boolean(flipLeft)

  return (
    <TooltipContainer
      ref={ref}
      zIndex={zIndexes.mask}
      minWidth={215}
      py="$spacing6"
      px="$spacing8"
      gap="$spacing8"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
      transform={shouldFlip ? 'translateX(-100%)' : 'none'}
      $sm={{
        transform: 'translateX(-50%)',
      }}
    >
      {/* Header row with avatar and "Your bid" */}
      <Flex row alignItems="center" gap="$spacing4">
        {connectedWalletAddress ? (
          <AccountIcon address={connectedWalletAddress} size={BID_LINE.TOOLTIP_AVATAR_SIZE} />
        ) : (
          <Flex
            width={BID_LINE.TOOLTIP_AVATAR_SIZE}
            height={BID_LINE.TOOLTIP_AVATAR_SIZE}
            borderRadius="$roundedFull"
            backgroundColor="$accent1"
          />
        )}
        <Text variant="body4" color="$neutral1" lineHeight={16}>
          {t('toucan.bidDistribution.yourBid')}
        </Text>
      </Flex>

      {/* Divider line */}
      <Flex width="100%" height={1} backgroundColor="$surface3" />

      {/* Bottom section: Volume info */}
      <Flex gap="$spacing2">
        {/* Bid volume row: dot + "Bid vol." on left, fiat amount on right */}
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row alignItems="center" gap="$spacing4">
            <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={concentrationColor} />
            <Text variant="body4" color="$neutral2" lineHeight={16}>
              {t('toucan.bidDistribution.bidVol')}
            </Text>
          </Flex>
          <Text variant="body4" color="$neutral1" lineHeight={16}>
            {formattedVolume}
          </Text>
        </Flex>

        {/* Percentage of volume row */}
        <Text variant="body4" color="$neutral2" lineHeight={16}>
          {volumePercentDisplay}
        </Text>
      </Flex>
    </TooltipContainer>
  )
})

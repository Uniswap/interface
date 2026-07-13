import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useCreateAuctionDistributionBarColors } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionDistributionBarColors'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import { type RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { amountToPercent, getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'

const BAR_GAP_PX = 4
const SOLD_BRACKET_HEIGHT_PX = 8
const SOLD_BRACKET_RADIUS_PX = 4
const HOVER_HIT_AREA_PX = 8
const DIMMED_OPACITY = 0.64

type DistributionBarSegment = 'fundraise' | 'raiseSideLp' | 'tokenSideLp'

interface TokenDistributionBarProps {
  label?: string
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
  tokenSymbol: string
  chainId: UniverseChainId
  raiseCurrency: RaiseCurrency
  tokenColor?: TokenAccentHex
}

export function TokenDistributionBar({
  label,
  auctionSupplyAmount,
  postAuctionLiquidityAmount,
  tokenSymbol,
  chainId,
  raiseCurrency,
  tokenColor,
}: TokenDistributionBarProps) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const raiseCurrencySymbol = getRaiseCurrencyAsCurrency(raiseCurrency, chainId)?.symbol ?? ''
  const { fundraiseColor, raiseSideLpColor, tokenSideLpColor } = useCreateAuctionDistributionBarColors({
    chainId,
    raiseCurrency,
    tokenColor,
  })
  const [hoveredSegment, setHoveredSegment] = useState<DistributionBarSegment | null>(null)
  const segmentOpacity = (segment: DistributionBarSegment): number =>
    hoveredSegment === null || hoveredSegment === segment ? 1 : DIMMED_OPACITY
  const formatAmount = (amount: CurrencyAmount<Currency>): string =>
    formatNumberOrString({
      value: amount.toExact(),
      type: NumberType.TokenQuantityStats,
      placeholder: '0',
    })

  const renderBarSegment = ({
    segment,
    flex,
    color,
    marginRight = 0,
  }: {
    segment: DistributionBarSegment
    flex: number
    color: string
    marginRight?: number
  }) => (
    <Flex
      flex={flex}
      position="relative"
      marginRight={marginRight}
      $platform-web={{ transition: 'flex 200ms ease-in-out, margin-right 200ms ease-in-out' }}
    >
      <Flex height="$spacing12" borderRadius="$rounded4" backgroundColor={color} opacity={segmentOpacity(segment)} />
      <Flex
        position="absolute"
        top={-HOVER_HIT_AREA_PX}
        bottom={-HOVER_HIT_AREA_PX}
        left={0}
        right={0}
        onMouseEnter={() => setHoveredSegment(segment)}
        onMouseLeave={() => setHoveredSegment(null)}
      />
    </Flex>
  )

  const renderLegendItem = ({
    segment,
    color,
    amount,
    description,
  }: {
    segment: DistributionBarSegment
    color: string
    amount: string
    description: string
  }) => (
    <Flex
      row
      gap="$spacing4"
      alignItems="center"
      opacity={segmentOpacity(segment)}
      onMouseEnter={() => setHoveredSegment(segment)}
      onMouseLeave={() => setHoveredSegment(null)}
    >
      <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor={color} />
      <Text variant="body4" color="$neutral1">
        {amount}
      </Text>
      <Text variant="body4" color="$neutral2">
        {description}
      </Text>
    </Flex>
  )

  // auctionSupplyAmount = deposited tokens D = sold S + reserve R with R = r·S. Each LP token leg = postAuctionLiquidityAmount = r·S = R.
  const soldAmount = auctionSupplyAmount.subtract(postAuctionLiquidityAmount)
  const fundraiseAmount = soldAmount.subtract(postAuctionLiquidityAmount)
  const fundraisePercent = amountToPercent(auctionSupplyAmount, fundraiseAmount)
  const lpLegPercent = amountToPercent(auctionSupplyAmount, postAuctionLiquidityAmount)
  const totalSoldPercent = amountToPercent(auctionSupplyAmount, soldAmount)

  const showFundraise = fundraisePercent > 0
  // Bar row uses fixed px gaps between flex segments; sold width must use the same flex
  // basis as the colored segments, not a flat % of the full row (which ignores gaps).
  const barSegmentCount = showFundraise ? 3 : 2
  const barGapCount = barSegmentCount - 1
  const gapsInsideSoldRegion = showFundraise ? 1 : 0
  const soldFraction = Math.min(totalSoldPercent, 100) / 100
  const totalSoldWidth = `calc((100% - ${
    barGapCount * BAR_GAP_PX
  }px) * ${soldFraction} + ${gapsInsideSoldRegion * BAR_GAP_PX}px)`

  return (
    <Flex gap="$spacing12">
      {label && (
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      )}

      <Flex gap="$spacing4">
        {totalSoldPercent > 0 && (
          <Flex
            row
            alignItems="flex-end"
            gap="$spacing8"
            width={totalSoldWidth}
            maxWidth="100%"
            $platform-web={{ transition: 'width 200ms ease-in-out' }}
          >
            <Flex row flex={1} alignItems="flex-start">
              <Flex
                width={SOLD_BRACKET_RADIUS_PX}
                height={SOLD_BRACKET_HEIGHT_PX}
                borderTopWidth={1}
                borderLeftWidth={1}
                borderTopLeftRadius={SOLD_BRACKET_RADIUS_PX}
                borderColor="$neutral3"
              />
              <Flex flex={1} height={1} backgroundColor="$neutral3" />
            </Flex>
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body4" color="$neutral1">
                {formatAmount(soldAmount)}
              </Text>
              <Text variant="body4" color="$neutral2">
                {t('common.sold').toLowerCase()}
              </Text>
            </Flex>
            <Flex row flex={1} alignItems="flex-start">
              <Flex flex={1} height={1} backgroundColor="$neutral3" />
              <Flex
                width={SOLD_BRACKET_RADIUS_PX}
                height={SOLD_BRACKET_HEIGHT_PX}
                borderTopWidth={1}
                borderRightWidth={1}
                borderTopRightRadius={SOLD_BRACKET_RADIUS_PX}
                borderColor="$neutral3"
              />
            </Flex>
          </Flex>
        )}

        <Flex row height="$spacing12" gap={BAR_GAP_PX}>
          {renderBarSegment({
            segment: 'fundraise',
            flex: Math.max(0, fundraisePercent),
            color: fundraiseColor,
            // Keep the segment mounted so flex can animate to 0; cancel its trailing gap when collapsed.
            marginRight: showFundraise ? 0 : -BAR_GAP_PX,
          })}
          {renderBarSegment({ segment: 'raiseSideLp', flex: lpLegPercent, color: raiseSideLpColor })}
          {renderBarSegment({ segment: 'tokenSideLp', flex: lpLegPercent, color: tokenSideLpColor })}
        </Flex>
      </Flex>

      <Flex row gap="$spacing12" flexWrap="wrap" alignItems="center">
        {showFundraise &&
          renderLegendItem({
            segment: 'fundraise',
            color: fundraiseColor,
            amount: formatAmount(fundraiseAmount),
            description: t('toucan.createAuction.step.configureAuction.distribution.fundraiseSold', {
              raiseToken: raiseCurrencySymbol,
            }),
          })}
        {renderLegendItem({
          segment: 'raiseSideLp',
          color: raiseSideLpColor,
          amount: formatAmount(postAuctionLiquidityAmount),
          description: t('toucan.createAuction.step.configureAuction.distribution.tokenLpSoldRaiseSide', {
            token: raiseCurrencySymbol,
          }),
        })}
        {renderLegendItem({
          segment: 'tokenSideLp',
          color: tokenSideLpColor,
          amount: formatAmount(postAuctionLiquidityAmount),
          description: t('toucan.createAuction.step.configureAuction.distribution.tokenLpReservedTokenSide', {
            token: tokenSymbol,
          }),
        })}
      </Flex>
    </Flex>
  )
}

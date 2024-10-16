import { useGetRangeDisplay } from 'components/Liquidity/utils'
import { PriceOrdering } from 'components/PositionListItem'
import { useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { ReverseArrows } from 'ui/src/components/icons/ReverseArrows'
import { Trans } from 'uniswap/src/i18n'

interface LiquidityPositionFeeStatsProps {
  formattedUsdValue?: string
  formattedUsdFees?: string
  totalApr?: string
  feeApr?: string
  priceOrdering: PriceOrdering
  feeTier?: string
  tickLower?: string
  tickUpper?: string
  showReverseButton?: boolean
}

const PrimaryText = styled(Text, {
  color: '$neutral1',
  variant: 'body1',
})

const SecondaryText = styled(Text, {
  color: '$neutral2',
  variant: 'body3',
})

export function LiquidityPositionFeeStats({
  formattedUsdValue,
  formattedUsdFees,
  totalApr,
  feeApr,
  priceOrdering,
  tickLower,
  tickUpper,
  feeTier,
  showReverseButton = true,
}: LiquidityPositionFeeStatsProps) {
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex row alignItems="center" gap="$gap20">
      {formattedUsdValue && (
        <Flex gap="$gap4">
          <PrimaryText>{formattedUsdValue}</PrimaryText>
          {formattedUsdFees && <SecondaryText>+{formattedUsdFees} fees</SecondaryText>}
        </Flex>
      )}
      {totalApr && (
        <Flex gap="$gap4">
          <PrimaryText>{totalApr}</PrimaryText>
          <SecondaryText>
            <Trans i18nKey="position.stats.totalApr" />
          </SecondaryText>
        </Flex>
      )}
      {feeApr && (
        <Flex gap="$gap4">
          <PrimaryText>{feeApr}</PrimaryText>
          <SecondaryText>
            <Trans i18nKey="position.stats.feeApr" />
          </SecondaryText>
        </Flex>
      )}
      {priceOrdering.priceLower && priceOrdering.priceUpper && (
        <>
          <Flex gap="$gap4">
            <Flex row gap="$gap12" alignItems="center">
              <SecondaryText>
                <Trans i18nKey="chart.price.label.low" />
              </SecondaryText>
              <PrimaryText>
                {minPrice} {tokenASymbol} / {tokenBSymbol}
              </PrimaryText>
            </Flex>
            <Flex row gap="$gap12" alignItems="center">
              <SecondaryText>
                <Trans i18nKey="chart.price.label.high" />
              </SecondaryText>
              <PrimaryText>
                {maxPrice} {tokenASymbol} / {tokenBSymbol}
              </PrimaryText>
            </Flex>
          </Flex>
          {showReverseButton && (
            <Flex
              height="100%"
              justifyContent="flex-end"
              onPress={() => setPricesInverted((prevInverted) => !prevInverted)}
            >
              <ReverseArrows {...ClickableTamaguiStyle} color="$neutral2" size={16} />
            </Flex>
          )}
        </>
      )}
    </Flex>
  )
}

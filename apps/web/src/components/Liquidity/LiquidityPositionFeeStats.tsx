import { useGetRangeDisplay } from 'components/Liquidity/hooks'
import { PriceOrdering } from 'components/PositionListItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { Trans, useTranslation } from 'uniswap/src/i18n'

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
  priceOrdering,
  tickLower,
  tickUpper,
  feeTier,
  showReverseButton = true,
}: LiquidityPositionFeeStatsProps) {
  const { t } = useTranslation()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex row alignItems="center" gap="$gap20" justifyContent="space-between">
      <Flex gap="$gap4">
        {formattedUsdValue ? (
          <PrimaryText>{formattedUsdValue}</PrimaryText>
        ) : (
          <MouseoverTooltip text={<Trans i18nKey="position.valueUnavailable" />} placement="top">
            <PrimaryText>-</PrimaryText>
          </MouseoverTooltip>
        )}
        <SecondaryText variant="body3" color="$neutral2">
          {t('pool.position')}
        </SecondaryText>
      </Flex>
      <Flex gap="$gap4">
        <PrimaryText>{formattedUsdFees || t('common.unavailable')}</PrimaryText>
        <SecondaryText variant="body3" color="$neutral2">
          {t('common.fees')}
        </SecondaryText>
      </Flex>
      {/* TODO: add APR once its been calculated. */}
      <Flex minWidth={224} alignSelf="flex-start">
        {priceOrdering.priceLower && priceOrdering.priceUpper ? (
          <>
            <Flex gap="$gap4">
              <Flex row gap="$gap12" alignItems="center">
                <SecondaryText>
                  <Trans i18nKey="common.min" />
                </SecondaryText>
                <PrimaryText>
                  {minPrice} {tokenASymbol} / {tokenBSymbol}
                </PrimaryText>
              </Flex>
              <Flex row gap="$gap12" alignItems="center">
                <SecondaryText>
                  <Trans i18nKey="common.max" />
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
                <ArrowUpDown {...ClickableTamaguiStyle} color="$neutral2" size="$icon.16" rotate="90deg" />
              </Flex>
            )}
          </>
        ) : (
          <Flex grow>
            <Text variant="body3" color="$neutral2">
              {t('common.fullRange')}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

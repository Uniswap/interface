// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useGetRangeDisplay } from 'components/Liquidity/hooks'
import { PriceOrdering } from 'components/PositionListItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
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
  version: ProtocolVersion
  apr?: number
}

const PrimaryText = styled(Text, {
  color: '$neutral1',
  variant: 'body2',
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
  version,
  apr,
}: LiquidityPositionFeeStatsProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex row justifyContent="space-between">
      <Flex gap="$gap4" flexBasis="20%">
        {formattedUsdValue ? (
          <PrimaryText>{formattedUsdValue}</PrimaryText>
        ) : (
          <MouseoverTooltip text={<Trans i18nKey="position.valueUnavailable" />} placement="top">
            <PrimaryText>-</PrimaryText>
          </MouseoverTooltip>
        )}
        <SecondaryText>{t('pool.position')}</SecondaryText>
      </Flex>
      <Flex gap="$gap4" flexBasis="20%">
        {version === ProtocolVersion.V2 || !!formattedUsdFees ? (
          <>
            {version === ProtocolVersion.V2 ? (
              <Flex row gap="$gap4" alignItems="center">
                <Text variant="body2" color="$neutral2">
                  {t('common.unavailable')}
                </Text>
                <MouseoverTooltip text={t('fee.unavailable')} placement="auto">
                  <Flex justifyContent="center">
                    <InfoCircleFilled color="$neutral2" size="$icon.16" />
                  </Flex>
                </MouseoverTooltip>
              </Flex>
            ) : (
              <PrimaryText>{formattedUsdFees}</PrimaryText>
            )}
            <SecondaryText variant="body3" color="$neutral2">
              {t('common.fees')}
            </SecondaryText>
          </>
        ) : null}
      </Flex>
      <Flex gap="$gap4" flexBasis="20%">
        {!!apr && (
          <>
            <PrimaryText>{formatPercent(apr)}</PrimaryText>
            <SecondaryText variant="body3" color="$neutral2">
              {t('pool.apr')}
            </SecondaryText>
          </>
        )}
      </Flex>
      <Flex minWidth={224} alignSelf="flex-start">
        {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
          <Flex gap="$gap4">
            <Flex row gap="$gap12" alignItems="center">
              <SecondaryText>
                <Trans i18nKey="common.min" />
              </SecondaryText>
              <SecondaryText color="$neutral1">
                {minPrice} {tokenASymbol} / {tokenBSymbol}
              </SecondaryText>
            </Flex>
            <Flex row gap="$gap12" alignItems="center">
              <SecondaryText>
                <Trans i18nKey="common.max" />
              </SecondaryText>
              <SecondaryText color="$neutral1">
                {maxPrice} {tokenASymbol} / {tokenBSymbol}
              </SecondaryText>
              <Flex
                height="100%"
                justifyContent="flex-end"
                onPress={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPricesInverted((prevInverted) => !prevInverted)
                }}
              >
                <ArrowUpDown {...ClickableTamaguiStyle} color="$neutral2" size="$icon.16" rotate="90deg" />
              </Flex>
            </Flex>
          </Flex>
        ) : (
          <Flex grow>
            <SecondaryText>{t('common.fullRange')}</SecondaryText>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

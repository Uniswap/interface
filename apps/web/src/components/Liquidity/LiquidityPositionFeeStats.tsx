// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CHART_WIDTH } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useGetRangeDisplay } from 'components/Liquidity/hooks'
import { PriceOrdering } from 'components/PositionListItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { TextLoader } from 'pages/Pool/Positions/shared'
import { Dispatch, SetStateAction } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

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
  pricesInverted: boolean
  setPricesInverted: Dispatch<SetStateAction<boolean>>
}

const PrimaryText = styled(Text, {
  color: '$neutral1',
  variant: 'body2',
})

const SecondaryText = styled(Text, {
  color: '$neutral2',
  variant: 'body3',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

function WrapChildrenForMediaSize({ children }: { children: React.ReactNode }) {
  const isScreenSize = useScreenSize()
  const isMobile = !isScreenSize['navDropdownMobileDrawer']

  if (isMobile) {
    return (
      <Flex row gap="$gap12">
        {children}
      </Flex>
    )
  }

  return <>{children}</>
}

function FeeStat({ children }: { children: React.ReactNode }) {
  return (
    <Flex gap="$gap4" flex={1} flexBasis={0} $sm={{ flexBasis: 'auto' }}>
      {children}
    </Flex>
  )
}

function FeeStatLoader() {
  return (
    <Flex gap="$gap4">
      <TextLoader variant="body2" width={60} />
      <TextLoader variant="body3" width={40} />
    </Flex>
  )
}

export function LiquidityPositionFeeStatsLoader() {
  return (
    <Flex row gap="$gap20" justifyContent="space-between" width="50%" $md={{ width: '100%' }}>
      <FeeStatLoader />
      <FeeStatLoader />
      <FeeStatLoader />
    </Flex>
  )
}

export function LiquidityPositionFeeStats({
  formattedUsdValue,
  formattedUsdFees,
  priceOrdering,
  tickLower,
  tickUpper,
  feeTier,
  version,
  apr,
  pricesInverted,
  setPricesInverted,
}: LiquidityPositionFeeStatsProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex
      row
      justifyContent="space-between"
      gap="$gap20"
      $md={{ row: false, gap: '$gap24', flexDirection: 'column-reverse' }}
    >
      <Flex row gap="$gap20" grow $sm={{ row: false, gap: '$gap24' }}>
        <WrapChildrenForMediaSize>
          <FeeStat>
            {formattedUsdValue ? (
              <PrimaryText>{formattedUsdValue}</PrimaryText>
            ) : (
              <MouseoverTooltip text={<Trans i18nKey="position.valueUnavailable" />} placement="top">
                <PrimaryText>-</PrimaryText>
              </MouseoverTooltip>
            )}
            <SecondaryText>{t('pool.position')}</SecondaryText>
          </FeeStat>
          <FeeStat>
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
              <PrimaryText>{formattedUsdFees ?? '-'}</PrimaryText>
            )}
            <SecondaryText variant="body3" color="$neutral2">
              {t('common.fees')}
            </SecondaryText>
          </FeeStat>
        </WrapChildrenForMediaSize>
        <FeeStat>
          <PrimaryText>{apr ? formatPercent(apr) : '-'}</PrimaryText>
          <SecondaryText variant="body3" color="$neutral2">
            {t('pool.apr')}
          </SecondaryText>
        </FeeStat>
      </Flex>
      <Flex group="item" minWidth={224} alignSelf="flex-start" width={CHART_WIDTH} $md={{ width: '100%' }}>
        {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
          <Flex gap="$gap4">
            <Flex row gap="$gap12" alignItems="center">
              <SecondaryText flexShrink={0}>
                <Trans i18nKey="common.min" />
              </SecondaryText>
              <SecondaryText color="$neutral1">
                {minPrice} {tokenASymbol} / {tokenBSymbol}
              </SecondaryText>
            </Flex>
            <Flex row gap="$gap8" alignItems="center">
              <SecondaryText flexShrink={0}>
                <Trans i18nKey="common.max" />
              </SecondaryText>
              <SecondaryText color="$neutral1" display="flex" alignItems="center" gap="$gap4">
                <span
                  style={{
                    ...EllipsisTamaguiStyle,
                  }}
                >
                  {maxPrice}
                </span>
                <span>
                  {tokenASymbol} / {tokenBSymbol}
                </span>
              </SecondaryText>
              <Flex
                height="100%"
                justifyContent="flex-end"
                onPress={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setPricesInverted((prevInverted) => !prevInverted)
                }}
                {...ClickableTamaguiStyle}
                display="none"
                $group-item-hover={{ display: 'flex' }}
              >
                <ArrowUpDown color="$neutral2" size="$icon.16" rotate="90deg" />
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

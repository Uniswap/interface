import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CHART_WIDTH } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useGetRangeDisplay } from 'components/Liquidity/hooks/useGetRangeDisplay'
import { TextLoader } from 'components/Liquidity/Loader'
import LPIncentiveFeeStatTooltip from 'components/Liquidity/LPIncentives/LPIncentiveFeeStatTooltip'
import { LPIncentiveRewardsBadge } from 'components/Liquidity/LPIncentives/LPIncentiveRewardsBadge'
import { PriceOrdering } from 'components/Liquidity/types'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { Dispatch, SetStateAction } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

interface LiquidityPositionFeeStatsProps extends LiquidityPositionMinMaxRangeProps {
  version: ProtocolVersion
  cardHovered: boolean
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  formattedUsdValue?: string
  formattedUsdFees?: string
  formattedLpIncentiveEarnings?: string
  totalApr?: number
  feeApr?: string
  apr?: number
  lpIncentiveRewardApr?: number
  hasRewards?: boolean
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
  const media = useMedia()
  const isMobile = media.sm

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
    <Flex flex={1} flexBasis={0} $sm={{ flexBasis: 'auto' }}>
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
  formattedLpIncentiveEarnings,
  priceOrdering,
  tickLower,
  tickUpper,
  tickSpacing,
  version,
  apr,
  currency0Info,
  currency1Info,
  cardHovered,
  pricesInverted,
  setPricesInverted,
  lpIncentiveRewardApr,
  totalApr,
  hasRewards,
}: LiquidityPositionFeeStatsProps) {
  const { t } = useTranslation()
  const earningsOrFees = hasRewards ? formattedLpIncentiveEarnings : (formattedUsdFees ?? '-')

  return (
    <Flex
      row
      justifyContent="space-between"
      gap="$gap20"
      py="$spacing16"
      px="$spacing24"
      borderBottomLeftRadius="$rounded20"
      borderBottomRightRadius="$rounded20"
      backgroundColor={cardHovered ? '$surface2Hovered' : '$surface2'}
    >
      <Flex row gap="$gap20" grow $sm={{ row: false }}>
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
              <PrimaryText>{earningsOrFees}</PrimaryText>
            )}
            <SecondaryText variant="body3" color="$neutral2">
              {hasRewards ? t('pool.earnings') : t('common.fees')}
            </SecondaryText>
          </FeeStat>
        </WrapChildrenForMediaSize>
        {lpIncentiveRewardApr ? (
          <LPIncentiveFeeStat
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            poolApr={apr}
            lpIncentiveRewardApr={lpIncentiveRewardApr}
            totalApr={totalApr}
          />
        ) : (
          <APRFeeStat apr={apr} />
        )}
      </Flex>
      <Flex $md={{ display: 'none' }}>
        <MinMaxRange
          priceOrdering={priceOrdering}
          tickLower={tickLower}
          tickUpper={tickUpper}
          tickSpacing={tickSpacing}
          pricesInverted={pricesInverted}
          setPricesInverted={setPricesInverted}
        />
      </Flex>
    </Flex>
  )
}

interface LiquidityPositionMinMaxRangeProps {
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: number
  tickUpper?: number
  pricesInverted: boolean
  setPricesInverted: Dispatch<SetStateAction<boolean>>
}

export function MinMaxRange({
  priceOrdering,
  tickLower,
  tickUpper,
  tickSpacing,
  pricesInverted,
  setPricesInverted,
}: LiquidityPositionMinMaxRangeProps) {
  const { t } = useTranslation()

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex group="item" minWidth={224} alignSelf="flex-start" width={CHART_WIDTH} $md={{ width: '100%' }} height="100%">
      {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
        <Flex
          gap="$gap4"
          $md={{ row: true, justifyContent: 'flex-start', gap: '$gap24', width: '100%' }}
          $sm={{ row: false, gap: '$gap4', width: '100%' }}
          justifyContent="center"
          height="100%"
        >
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
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
              justifyContent="center"
              onPress={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPricesInverted((prevInverted) => !prevInverted)
              }}
              {...ClickableTamaguiStyle}
              display="none"
              $group-item-hover={{ display: 'flex' }}
            >
              <ArrowDownArrowUp color="$neutral2" size="$icon.16" rotate="90deg" />
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex grow height="100%">
          <SecondaryText>{t('common.fullRange')}</SecondaryText>
        </Flex>
      )}
    </Flex>
  )
}

function APRFeeStat({ apr }: { apr?: number }) {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  return (
    <FeeStat>
      <PrimaryText>{apr ? formatPercent(apr) : '-'}</PrimaryText>
      <SecondaryText variant="body3" color="$neutral2">
        {t('pool.apr')}
      </SecondaryText>
    </FeeStat>
  )
}

function LPIncentiveFeeStat({
  currency0Info,
  currency1Info,
  lpIncentiveRewardApr,
  poolApr,
  totalApr,
}: {
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  lpIncentiveRewardApr: number
  poolApr?: number
  totalApr?: number
}) {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  return (
    <Flex flex={1.3} flexBasis={0} $sm={{ flexBasis: 'auto' }}>
      <MouseoverTooltip
        padding={0}
        text={
          <LPIncentiveFeeStatTooltip
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            poolApr={poolApr}
            lpIncentiveRewardApr={lpIncentiveRewardApr}
            totalApr={totalApr}
          />
        }
        size={TooltipSize.Small}
        placement="top"
      >
        <>
          <Flex row gap="$spacing6" alignItems="center">
            <Text variant="body2" color="$neutral1">
              {poolApr ? formatPercent(poolApr) : '-'}
            </Text>
            <LPIncentiveRewardsBadge formattedRewardApr={formatPercent(lpIncentiveRewardApr)} />
          </Flex>
          <SecondaryText variant="body3" color="$neutral2">
            {t('pool.totalAPR')}
          </SecondaryText>
        </>
      </MouseoverTooltip>
    </Flex>
  )
}

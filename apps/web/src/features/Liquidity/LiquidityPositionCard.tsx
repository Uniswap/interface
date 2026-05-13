import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, TouchableArea, useIsTouchDevice, useMedia } from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { zIndexes } from 'ui/src/theme'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { PositionInfo, PriceOrdering } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { MouseoverTooltip } from '~/components/Tooltip'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  LiquidityPositionRangeChartLoader,
} from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { WrappedLiquidityPositionSparkline } from '~/features/Liquidity/charts/LiquidityPositionSparkline'
import { useGetRangeDisplay } from '~/features/Liquidity/hooks/useGetRangeDisplay/useGetRangeDisplay'
import { useLpIncentivesFormattedEarnings } from '~/features/Liquidity/hooks/useLpIncentivesFormattedEarnings'
import { LiquidityPositionDropdownMenu } from '~/features/Liquidity/LiquidityPositionDropdownMenu'
import {
  LiquidityPositionFeeStats,
  LiquidityPositionFeeStatsLoader,
  MinMaxRange,
} from '~/features/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from '~/features/Liquidity/LiquidityPositionInfo'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { useHoverProps } from '~/hooks/useHoverProps'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function LiquidityPositionCardLoader() {
  return (
    <Shine>
      <Flex
        p="$spacing24"
        gap="$spacing24"
        borderWidth="$spacing1"
        borderRadius="$rounded20"
        borderColor="$surface3"
        width="100%"
        overflow="hidden"
        $md={{ gap: '$gap20' }}
      >
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
        >
          <LiquidityPositionInfoLoader />
          <LiquidityPositionRangeChartLoader height={CHART_HEIGHT} width={CHART_WIDTH} position="relative" />
        </Flex>
        <LiquidityPositionFeeStatsLoader />
      </Flex>
    </Shine>
  )
}

export function LiquidityPositionCard({
  liquidityPosition,
  isMiniVersion,
  showVisibilityOption,
  showMigrateButton = false,
  disabled = false,
  isVisible = true,
}: {
  liquidityPosition: PositionInfo
  isMiniVersion?: boolean
  showVisibilityOption?: boolean
  showMigrateButton?: boolean
  disabled?: boolean
  isVisible?: boolean
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isTouchDevice = useIsTouchDevice()
  const [priceInverted, setPriceInverted] = useState(false)
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const [hover, hoverProps] = useHoverProps()
  const media = useMedia()
  const isSmallScreen = media.sm

  const { fee0Amount, fee1Amount } = liquidityPosition
  const fiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)
  const fiatValue0 = useUSDCValue(liquidityPosition.currency0Amount, PollingInterval.Slow)
  const fiatValue1 = useUSDCValue(liquidityPosition.currency1Amount, PollingInterval.Slow)
  const priceOrdering = useMemo(() => {
    if (liquidityPosition.version === ProtocolVersion.V2 || !liquidityPosition.position) {
      return {}
    }

    const position = liquidityPosition.position
    const token0 = position.amount0.currency
    const token1 = position.amount1.currency

    return {
      priceLower: position.token0PriceLower,
      priceUpper: position.token0PriceUpper,
      quote: token1,
      base: token0,
    }
  }, [liquidityPosition])

  const { baseCurrency } = getBaseAndQuoteCurrencies(
    {
      TOKEN0: liquidityPosition.currency0Amount.currency,
      TOKEN1: liquidityPosition.currency1Amount.currency,
    },
    priceInverted,
  )

  const formattedUsdValue =
    fiatValue0 && fiatValue1
      ? convertFiatAmountFormatted(fiatValue0.add(fiatValue1).toExact(), NumberType.FiatTokenPrice)
      : undefined

  const { totalFormattedEarnings, hasRewards, formattedFeesValue } = useLpIncentivesFormattedEarnings({
    liquidityPosition,
    fiatFeeValue0,
    fiatFeeValue1,
  })

  const currency0Id =
    liquidityPosition.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency0Amount.currency))
      : undefined
  const currency1Id =
    liquidityPosition.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency1Amount.currency))
      : undefined

  const currency0Info = useCurrencyInfo(currency0Id)
  const currency1Info = useCurrencyInfo(currency1Id)

  const priceOrderingForChart = useMemo(() => {
    if (
      (liquidityPosition.version !== ProtocolVersion.V3 && liquidityPosition.version !== ProtocolVersion.V4) ||
      !liquidityPosition.position ||
      !liquidityPosition.liquidity ||
      !liquidityPosition.tickLower ||
      !liquidityPosition.tickUpper
    ) {
      return {}
    }
    return {
      base: baseCurrency,
      priceLower: priceInverted
        ? liquidityPosition.position.token0PriceUpper.invert()
        : liquidityPosition.position.token0PriceLower,
      priceUpper: priceInverted
        ? liquidityPosition.position.token0PriceLower.invert()
        : liquidityPosition.position.token0PriceUpper,
    }
  }, [liquidityPosition, baseCurrency, priceInverted])

  return (
    <>
      {isMiniVersion ? (
        <MiniPositionCard
          disabled={disabled}
          showVisibilityOption={showVisibilityOption}
          positionInfo={liquidityPosition}
          formattedUsdValue={formattedUsdValue}
          formattedUsdFees={formattedFeesValue}
          priceOrdering={priceOrdering}
          tickSpacing={liquidityPosition.tickSpacing}
          tickLower={liquidityPosition.tickLower}
          tickUpper={liquidityPosition.tickUpper}
          isVisible={isVisible}
        />
      ) : (
        <Flex
          {...hoverProps}
          group
          position="relative"
          gap="$spacing16"
          borderWidth="$spacing1"
          borderRadius="$rounded20"
          borderColor="$surface3"
          width="100%"
          hoverStyle={!disabled ? { borderColor: '$surface3Hovered', backgroundColor: '$surface1Hovered' } : {}}
        >
          <Flex
            row
            pt="$spacing24"
            px="$spacing24"
            alignItems="center"
            justifyContent="space-between"
            overflow="hidden"
            $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
          >
            <LiquidityPositionInfo
              positionInfo={liquidityPosition}
              isMiniVersion={isSmallScreen}
              showMigrateButton={showMigrateButton}
            />
            <WrappedLiquidityPositionSparkline
              version={liquidityPosition.version}
              chainId={liquidityPosition.chainId}
              priceInverted={priceInverted}
              positionStatus={liquidityPosition.status}
              poolAddressOrId={liquidityPosition.poolId}
              priceOrdering={priceOrderingForChart}
            />
            <Flex $md={{ display: 'block' }} display="none" width="100%">
              <MinMaxRange
                priceOrdering={priceOrdering}
                tickLower={liquidityPosition.tickLower}
                tickUpper={liquidityPosition.tickUpper}
                tickSpacing={liquidityPosition.tickSpacing}
                pricesInverted={priceInverted}
                setPricesInverted={setPriceInverted}
              />
            </Flex>
          </Flex>
          <LiquidityPositionFeeStats
            formattedUsdValue={formattedUsdValue}
            formattedUsdFees={formattedFeesValue}
            formattedLpIncentiveEarnings={totalFormattedEarnings}
            hasRewards={hasRewards}
            priceOrdering={priceOrdering}
            tickSpacing={liquidityPosition.tickSpacing}
            tickLower={liquidityPosition.tickLower}
            tickUpper={liquidityPosition.tickUpper}
            version={liquidityPosition.version}
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            apr={liquidityPosition.apr}
            cardHovered={hover && !disabled}
            pricesInverted={priceInverted}
            setPricesInverted={setPriceInverted}
            lpIncentiveRewardApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.boostedApr
                : undefined
            }
            totalApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.totalApr
                : undefined
            }
          />
          {!isTouchDevice && !disabled && (
            <Flex position="absolute" top="$spacing16" right="$spacing16" zIndex={zIndexes.mask}>
              <LiquidityPositionDropdownMenu
                showVisibilityOption={showVisibilityOption}
                liquidityPosition={liquidityPosition}
                isVisible={isVisible}
              />
            </Flex>
          )}
        </Flex>
      )}
    </>
  )
}

function MiniPositionCard({
  positionInfo,
  showVisibilityOption,
  formattedUsdFees,
  formattedUsdValue,
  priceOrdering,
  tickSpacing,
  tickLower,
  tickUpper,
  disabled,
  isVisible,
}: {
  positionInfo: PositionInfo
  showVisibilityOption?: boolean
  formattedUsdFees?: string
  formattedUsdValue?: string
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: number
  tickUpper?: number
  disabled?: boolean
  isVisible?: boolean
}) {
  const { t } = useTranslation()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex
      gap="$gap20"
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
      position="relative"
      group
      hoverStyle={!disabled ? { backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' } : {}}
      pressStyle={!disabled ? { backgroundColor: '$surface1Pressed', borderColor: '$surface3Pressed' } : {}}
    >
      <LiquidityPositionInfo hideStatusIndicator positionInfo={positionInfo} currencyLogoSize={32} isMiniVersion />
      <Flex row gap="$gap12">
        <Flex>
          {formattedUsdValue ? (
            <Text variant="body2">{formattedUsdValue}</Text>
          ) : (
            <MouseoverTooltip text={t('position.valueUnavailable')} placement="top">
              <Text variant="body2">-</Text>
            </MouseoverTooltip>
          )}
          <Text variant="body4" color="$neutral2">
            {t('pool.position')}
          </Text>
        </Flex>
        <Flex>
          <Text variant="body2">{formattedUsdFees || t('common.unavailable')}</Text>
          <Text variant="body4" color="$neutral2">
            {t('common.fees')}
          </Text>
        </Flex>
      </Flex>
      {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
        <TouchableArea
          {...ClickableTamaguiStyle}
          onPress={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setPricesInverted((prevInverted) => !prevInverted)
          }}
        >
          <Flex row gap={10}>
            <Text variant="body4">
              {minPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
            <ArrowsLeftRight color="$neutral2" size="$icon.16" />
            <Text variant="body4">
              {maxPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
          </Flex>
        </TouchableArea>
      ) : (
        <Text variant="body4">{t('common.fullRange')}</Text>
      )}
      {!disabled && (
        <Flex position="absolute" top="$spacing16" right="$spacing16" zIndex={zIndexes.mask}>
          <LiquidityPositionDropdownMenu
            showVisibilityOption={showVisibilityOption}
            liquidityPosition={positionInfo}
            isVisible={isVisible}
          />
        </Flex>
      )}
    </Flex>
  )
}

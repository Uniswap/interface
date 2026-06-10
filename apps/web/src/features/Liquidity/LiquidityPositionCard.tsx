import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useMemo, useState } from 'react'
import { Flex, Shine, useIsTouchDevice, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  LiquidityPositionRangeChartLoader,
} from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { WrappedLiquidityPositionSparkline } from '~/features/Liquidity/charts/LiquidityPositionSparkline'
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

export const LiquidityPositionCard = memo(function LiquidityPositionCard({
  liquidityPosition,
  showVisibilityOption,
  showMigrateButton = false,
  disabled = false,
  isVisible = true,
  readOnly = false,
}: {
  liquidityPosition: PositionInfo
  showVisibilityOption?: boolean
  showMigrateButton?: boolean
  disabled?: boolean
  isVisible?: boolean
  readOnly?: boolean
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isTouchDevice = useIsTouchDevice()
  const [priceInverted, setPriceInverted] = useState(false)
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const [hover, hoverProps] = useHoverProps()
  const media = useMedia()
  const isSmallScreen = media.sm

  const { fee0Amount, fee1Amount } = liquidityPosition
  const sdkPosition = liquidityPosition.version !== ProtocolVersion.V2 ? liquidityPosition.position : undefined
  const fiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)
  const fiatValue0 = useUSDCValue(liquidityPosition.currency0Amount, PollingInterval.Slow)
  const fiatValue1 = useUSDCValue(liquidityPosition.currency1Amount, PollingInterval.Slow)
  const priceOrdering = useMemo(() => {
    if (!sdkPosition) {
      return {}
    }

    const token0 = sdkPosition.amount0.currency
    const token1 = sdkPosition.amount1.currency

    return {
      priceLower: sdkPosition.token0PriceLower,
      priceUpper: sdkPosition.token0PriceUpper,
      quote: token1,
      base: token0,
    }
  }, [sdkPosition])

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
    if (!sdkPosition || !liquidityPosition.liquidity || !liquidityPosition.tickLower || !liquidityPosition.tickUpper) {
      return {}
    }
    return {
      base: baseCurrency,
      priceLower: priceInverted ? sdkPosition.token0PriceUpper.invert() : sdkPosition.token0PriceLower,
      priceUpper: priceInverted ? sdkPosition.token0PriceLower.invert() : sdkPosition.token0PriceUpper,
    }
  }, [
    sdkPosition,
    liquidityPosition.liquidity,
    liquidityPosition.tickLower,
    liquidityPosition.tickUpper,
    baseCurrency,
    priceInverted,
  ])

  return (
    <>
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
              readOnly={readOnly}
            />
          </Flex>
        )}
      </Flex>
    </>
  )
})

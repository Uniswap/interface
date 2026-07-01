import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useIsTouchDevice } from 'ui/src'
import { LinkHorizontalAlt } from 'ui/src/components/icons/LinkHorizontalAlt'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { useGetRangeDisplay } from 'uniswap/src/features/positions/hooks/useGetRangeDisplay'
import { lpStatusConfig } from 'uniswap/src/features/positions/lpStatusConfig'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getFeeLabel, getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { TableText } from '~/components/Table/shared/TableText'
import { DISTRIBUTION_CHART_WIDTH, DistributionChips } from '~/features/Liquidity/DistributionChips'
import { LiquidityPositionDropdownMenu } from '~/features/Liquidity/LiquidityPositionDropdownMenu'
import { useColor } from '~/hooks/useColor'

export function PoolCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const { currency0Amount, currency1Amount, version, v4hook, feeTier } = position

  const protocolLabel = getProtocolVersionLabel(version)
  const feeLabel = getFeeLabel({ version, feeTier, dynamicLabel: t('common.dynamic') })
  const hasHook = v4hook && v4hook !== ZERO_ADDRESS

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
  ])

  const reversed = shouldReverseForWaterfall(currency0Amount.currency, currency1Amount.currency)
  const [baseAmount, quoteAmount] = reversed ? [currency1Amount, currency0Amount] : [currency0Amount, currency1Amount]
  const [baseInfo, quoteInfo] = reversed ? [currency1Info, currency0Info] : [currency0Info, currency1Info]

  return (
    <Flex row alignItems="center" gap="$spacing8" shrink width="100%">
      <SplitLogo chainId={position.chainId} inputCurrencyInfo={baseInfo} outputCurrencyInfo={quoteInfo} size={32} />
      <Flex shrink gap="$spacing2">
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {baseAmount.currency.symbol} / {quoteAmount.currency.symbol}
        </Text>
        <Flex row alignItems="center" gap="$spacing6">
          {protocolLabel && (
            <Text variant="body4" color="$neutral2" numberOfLines={1}>
              {protocolLabel}
            </Text>
          )}
          {hasHook && (
            <>
              <Dot />
              <Flex row alignItems="center" gap="$spacing2">
                <LinkHorizontalAlt color="$neutral2" size={12} />
                <Text variant="body4" color="$neutral2" numberOfLines={1}>
                  {shortenAddress({ address: v4hook })}
                </Text>
              </Flex>
            </>
          )}
          {feeLabel && (
            <>
              <Dot />
              <Text variant="body4" color="$neutral2" numberOfLines={1}>
                {feeLabel}
              </Text>
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}

const RANGE_STATUS_SLOT_HEIGHT = 20

function CurrentPriceContent({ position }: { position: PositionInfo }): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currentPrice = position.poolOrPair?.token0Price as Price<Currency, Currency> | undefined

  if (!currentPrice) {
    return null
  }

  return (
    <Text variant="body4" color="$neutral2" numberOfLines={1}>
      {t('common.currentPrice')}:{' '}
      {formatNumberOrString({ value: currentPrice.toSignificant(), type: NumberType.TokenTx })}{' '}
      {currentPrice.quoteCurrency.symbol}
    </Text>
  )
}

export function RangeCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const hasCurrentPrice = position.poolOrPair?.token0Price !== undefined
  const statusConfig = lpStatusConfig[position.status]

  const pricesInverted = shouldReverseForWaterfall(position.currency0Amount.currency, position.currency1Amount.currency)

  const priceOrdering = useMemo(() => {
    if (position.version === ProtocolVersion.V2 || !position.position) {
      return {}
    }
    return {
      priceLower: position.position.token0PriceLower,
      priceUpper: position.position.token0PriceUpper,
      quote: position.position.amount1.currency,
      base: position.position.amount0.currency,
    }
  }, [position])

  const { minPrice, maxPrice, tokenASymbol } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing: position.tickSpacing,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    pricesInverted,
  })

  const hasRange = position.tickLower !== undefined && position.tickUpper !== undefined

  return (
    <Flex gap="$spacing4" width="100%">
      {hasRange ? (
        <Flex row alignItems="baseline" gap="$spacing4">
          <Text variant="body3" color="$neutral1" numberOfLines={1} flexShrink={0}>
            {minPrice} → {maxPrice}
          </Text>
          <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={1} minWidth={0}>
            {tokenASymbol}
          </Text>
        </Flex>
      ) : (
        <Text variant="body3" color="$neutral2">
          –
        </Text>
      )}
      {hasCurrentPrice && statusConfig ? (
        <Flex row alignItems="center" gap="$spacing6">
          <StatusIndicatorCircle color={statusConfig.color} />
          <GroupHoverTransition
            height={RANGE_STATUS_SLOT_HEIGHT}
            defaultContent={
              <Flex height={RANGE_STATUS_SLOT_HEIGHT} justifyContent="center">
                <Text variant="body4" color={statusConfig.color}>
                  {t(statusConfig.i18nKey)}
                </Text>
              </Flex>
            }
            hoverContent={
              <Flex height={RANGE_STATUS_SLOT_HEIGHT} justifyContent="center">
                <CurrentPriceContent position={position} />
              </Flex>
            }
          />
        </Flex>
      ) : (
        <LiquidityPositionStatusIndicator status={position.status} textVariant="body4" />
      )}
    </Flex>
  )
}

export function DistributionCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const token0Color = useColor(position.currency0Amount.currency)
  const token1Color = useColor(position.currency1Amount.currency)
  return <DistributionBar position={position} token0Color={token0Color} token1Color={token1Color} />
}

export function LiquidityCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <TableText variant="body3">
      {convertFiatAmountFormatted(position.totalValueUsd, NumberType.FiatTokenPrice, '–')}
    </TableText>
  )
}

export function FeesCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <TableText variant="body3">
      {convertFiatAmountFormatted(position.uncollectedFeesUsd, NumberType.FiatTokenPrice, '–')}
    </TableText>
  )
}

export function AprCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  return <TableText variant="body3">{position.apr !== undefined ? formatPercent(position.apr) : '–'}</TableText>
}

export function CreatedCellContent(): JSX.Element {
  return (
    <TableText variant="body3" color="$neutral2">
      –
    </TableText>
  )
}

export function MenuCellContent({
  position,
  isVisible,
}: {
  position: PositionInfo
  isVisible: boolean
}): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  if (isTouchDevice) {
    return null
  }
  return <LiquidityPositionDropdownMenu liquidityPosition={position} showVisibilityOption isVisible={isVisible} />
}

function Dot(): JSX.Element {
  return <Flex height={3} width={3} borderRadius="$roundedFull" backgroundColor="$neutral3" />
}

export function getPositionValueDistribution({
  currency0Amount,
  currency1Amount,
  poolOrPair,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  poolOrPair: PositionInfo['poolOrPair']
}): { percent0: Percent; percent1: Percent; markerPosition: number } | undefined {
  if (!poolOrPair) {
    return undefined
  }

  const token0Price = poolOrPair.token0Price as Price<Currency, Currency>
  const value0 = token0Price.quote(currency0Amount)
  const value1 = currency1Amount
  const totalValue = value0.add(value1)

  if (!totalValue.greaterThan(0)) {
    return undefined
  }

  const percent0 = new Percent(value0.quotient, totalValue.quotient)
  const percent1 = new Percent(value1.quotient, totalValue.quotient)
  return { percent0, percent1, markerPosition: Number(percent0.toFixed(6)) / 100 }
}

function DistributionBar({
  position,
  token0Color,
  token1Color,
}: {
  position: PositionInfo
  token0Color: string
  token1Color: string
}): JSX.Element {
  const { formatPercent, formatCurrencyAmount } = useLocalizationContext()
  const { currency0Amount, currency1Amount, poolOrPair } = position

  const distribution = useMemo(
    () => getPositionValueDistribution({ currency0Amount, currency1Amount, poolOrPair }),
    [currency0Amount, currency1Amount, poolOrPair],
  )

  const hasValues = distribution !== undefined

  return (
    <Flex gap="$spacing4" width={DISTRIBUTION_CHART_WIDTH}>
      <DistributionChips
        token0Color={token0Color}
        token1Color={token1Color}
        markerPosition={distribution?.markerPosition}
      />
      <Flex row gap="$spacing8">
        <Text variant="body4" color="$neutral2" numberOfLines={1}>
          {hasValues
            ? `${formatPercent(Number(distribution.percent0.toFixed(2)))} ${currency0Amount.currency.symbol}`
            : `${formatCurrencyAmount({ value: currency0Amount, type: NumberType.TokenNonTx })} ${currency0Amount.currency.symbol}`}
        </Text>
        <Text variant="body4" color="$neutral2" numberOfLines={1}>
          {hasValues
            ? `${formatPercent(Number(distribution.percent1.toFixed(2)))} ${currency1Amount.currency.symbol}`
            : `${formatCurrencyAmount({ value: currency1Amount, type: NumberType.TokenNonTx })} ${currency1Amount.currency.symbol}`}
        </Text>
      </Flex>
    </Flex>
  )
}

import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { Flex, Text, useIsTouchDevice } from '@universe/mycelium'
import { LinkHorizontalAlt } from '@universe/mycelium/icons/LinkHorizontalAlt'
import { StatusIndicatorCircle } from '@universe/mycelium/icons/StatusIndicatorCircle'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { useGetRangeDisplay } from 'uniswap/src/features/positions/hooks/useGetRangeDisplay'
import { lpStatusConfig } from 'uniswap/src/features/positions/lpStatusConfig'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getExactSharePercent, getFeeLabel, getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { TableText } from '~/components/Table/shared/TableText'
import { TableRowHoverContext } from '~/components/Table/TableRowHoverContext'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { DISTRIBUTION_CHART_WIDTH, DistributionChips } from '~/features/Liquidity/DistributionChips'
import { LiquidityPositionDropdownMenu } from '~/features/Liquidity/LiquidityPositionDropdownMenu'
import { PoolAprTooltip } from '~/features/Liquidity/LPIncentives/PoolAprTooltip'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
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
            // flexShrink={0} keeps the short version label from being clamped (e.g. "v4" → "v") when a
            // hook badge widens the row past the fixed-width Pool cell; the hook address shrinks instead.
            <Text variant="body4" color="$neutral2" numberOfLines={1} flexShrink={0}>
              {protocolLabel}
            </Text>
          )}
          {hasHook && (
            <>
              <Dot />
              <Flex row alignItems="center" gap="$spacing2" shrink minWidth={0}>
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
              <Text variant="body4" color="$neutral2" numberOfLines={1} flexShrink={0}>
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

function CurrentPriceContent({
  position,
  pricesInverted,
}: {
  position: PositionInfo
  pricesInverted: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const token0Price = position.poolOrPair?.token0Price as Price<Currency, Currency> | undefined
  // Quote in the same asset as the min → max range above it
  const currentPrice = pricesInverted ? token0Price?.invert() : token0Price

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
  const rowHovered = useContext(TableRowHoverContext)
  const hasCurrentPrice = position.poolOrPair?.token0Price !== undefined
  const statusConfig = lpStatusConfig[position.status]

  const pricesInverted = shouldReverseForWaterfall(position.currency0Amount.currency, position.currency1Amount.currency)

  const isV2 = position.version === ProtocolVersion.V2

  const priceOrdering = useMemo(() => {
    if (isV2) {
      return {
        quote: position.currency1Amount.currency,
        base: position.currency0Amount.currency,
      }
    }
    if (!position.position) {
      return {}
    }
    return {
      priceLower: position.position.token0PriceLower,
      priceUpper: position.position.token0PriceUpper,
      quote: position.position.amount1.currency,
      base: position.position.amount0.currency,
    }
  }, [isV2, position])

  const { minPrice, maxPrice, tokenASymbol } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing: position.tickSpacing,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    pricesInverted,
  })

  const hasRange = isV2 || (position.tickLower !== undefined && position.tickUpper !== undefined)

  return (
    <Flex gap="$spacing4" width="100%">
      {hasRange ? (
        <Flex row alignItems="baseline" gap="$spacing4">
          <Text variant="body3" color="$neutral1" numberOfLines={1} flexShrink={0}>
            {isV2 ? '0' : minPrice} → {isV2 ? '∞' : maxPrice}
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
          <StatusIndicatorCircle color={statusConfig.color} flexShrink={0} />
          <GroupHoverTransition
            height={RANGE_STATUS_SLOT_HEIGHT}
            isHovered={rowHovered}
            defaultContent={
              <Flex height={RANGE_STATUS_SLOT_HEIGHT} justifyContent="center">
                <Text variant="body4" color={statusConfig.color}>
                  {t(statusConfig.i18nKey)}
                </Text>
              </Flex>
            }
            hoverContent={
              <Flex height={RANGE_STATUS_SLOT_HEIGHT} justifyContent="center">
                <CurrentPriceContent position={position} pricesInverted={pricesInverted} />
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
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const feesText = (
    <TableText variant="body3">
      {convertFiatAmountFormatted(position.uncollectedFeesUsd, NumberType.FiatTokenPrice, '–')}
    </TableText>
  )

  // v2 fees compound into the pair reserves, so the dash is permanent rather than missing data.
  // The tooltip explains the dash, so it is gated on the dash actually rendering: a v3/v4 position
  // with an unserved valuation renders the same dash and this explanation would be wrong there, and
  // a v2 row that ever arrived with a served value must not have it labelled as not visible.
  if (position.version !== ProtocolVersion.V2 || position.uncollectedFeesUsd !== undefined) {
    return feesText
  }

  return (
    <MouseoverTooltip text={t('fee.unavailable')} placement="top" size={TooltipSize.Max}>
      {feesText}
    </MouseoverTooltip>
  )
}

export function AprCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const { rewards } = position
  const aprText = (
    <TableText variant="body3">{position.apr !== undefined ? formatPercent(position.apr) : '–'}</TableText>
  )

  const hasRewards = !!rewards?.length
  const hasTimeframeAprs = position.apr1d !== undefined || position.apr7d !== undefined || position.apr30d !== undefined

  // Nothing to break down: no windowed APRs and no reward campaign, so the bare cell stands alone.
  if (!hasTimeframeAprs && !hasRewards) {
    return aprText
  }

  // One tooltip serves both cases: the windowed 24H/7D/30D breakdown, plus per-token reward rows and
  // a reconciling total when the pool is boosted. Currency infos are only used by the Pool APR
  // fallback row, which never shows here (day-data is always present on this surface), so they're
  // omitted.
  return (
    <MouseoverTooltip
      padding={0}
      size={TooltipSize.Small}
      placement="top"
      text={
        <PoolAprTooltip
          currency0Info={undefined}
          currency1Info={undefined}
          poolApr={position.apr}
          apr1d={position.apr1d}
          apr7d={position.apr7d}
          apr30d={position.apr30d}
          rewards={rewards}
          totalApr={position.totalApr}
        />
      }
    >
      {hasRewards ? (
        <Flex alignItems="flex-end" gap="$spacing6">
          {aprText}
          <RewardAprBadge rewards={rewards} isTokenColor size="sm" />
        </Flex>
      ) : (
        aprText
      )}
    </MouseoverTooltip>
  )
}

const ONE_WEEK_MS = 7 * ONE_DAY_MS

export function CreatedCellContent({ position }: { position: PositionInfo }): JSX.Element {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const { createdAt } = position
  const createdAtMs = createdAt ? createdAt * ONE_SECOND_MS : 0
  const abbreviated = useAbbreviatedTimeString(createdAtMs)

  if (!createdAt) {
    return (
      <TableText variant="body3" color="$neutral2">
        –
      </TableText>
    )
  }

  const isOlderThanWeek = Date.now() - createdAtMs >= ONE_WEEK_MS
  const label = isOlderThanWeek
    ? new Date(createdAtMs).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    : `${abbreviated} ${t('common.ago')}`
  const fullDateTime = new Date(createdAtMs).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <MouseoverTooltip text={fullDateTime} placement="top" size={TooltipSize.Max}>
      <TableText variant="body3" color="$neutral2">
        {label}
      </TableText>
    </MouseoverTooltip>
  )
}

export function MenuCellContent({
  position,
  isVisible,
  readOnly = false,
}: {
  position: PositionInfo
  isVisible: boolean
  readOnly?: boolean
}): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  if (isTouchDevice) {
    return null
  }
  return (
    <LiquidityPositionDropdownMenu
      liquidityPosition={position}
      showVisibilityOption
      isVisible={isVisible}
      readOnly={readOnly}
    />
  )
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

  const percent0 = getExactSharePercent(value0, totalValue)
  const percent1 = getExactSharePercent(value1, totalValue)
  if (!percent0 || !percent1) {
    return undefined
  }

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

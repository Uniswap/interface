import { Currency } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import {
  DepthPoint,
  getDisplayPair,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'

export const TooltipShell = ({ children }: { children: ReactNode }) => (
  <Flex
    p="$padding8"
    gap="$gap4"
    minWidth={150}
    borderRadius="$rounded12"
    borderColor="$surface3"
    borderWidth="$spacing1"
    backgroundColor="$surface2"
    pointerEvents="none"
  >
    {children}
  </Flex>
)

const TooltipRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Flex row justifyContent="space-between" gap="$gap8">
    <Text variant="body4" color="$neutral2">
      {label}
    </Text>
    {typeof value === 'string' ? <Text variant="body4">{value}</Text> : value}
  </Flex>
)

// Amount of base token required to move price to this depth level.
function amountInBase(point: DepthPoint, isReversed: boolean): number {
  const price0 = point.price
  if (!isReversed) {
    return point.inputIsToken0 ? point.swapToMove : price0 > 0 ? point.swapToMove / price0 : 0
  } else {
    return point.inputIsToken0 ? point.swapToMove * price0 : point.swapToMove
  }
}

export function DepthSideTooltipContent({
  point,
  tokenA,
  tokenB,
  isReversed,
  midPrice,
  color,
  feeTierLabel,
  baseUsdPrice,
  usdSymbol,
}: {
  point: DepthPoint
  tokenA: Currency
  tokenB: Currency
  isReversed: boolean
  midPrice: number
  color: string
  feeTierLabel?: string
  baseUsdPrice?: number
  usdSymbol?: string
}) {
  const { t } = useTranslation()
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { base, quote } = getDisplayPair({ tokenA, tokenB, isReversed })
  const baseSymbol = base.symbol ?? base.name ?? ''
  const quoteSymbol = quote.symbol ?? quote.name ?? ''
  const displayPrice = toDisplayPrice(point.price, isReversed)
  const displayMid = toDisplayPrice(midPrice, isReversed)

  const pct = displayMid > 0 ? ((displayPrice - displayMid) / displayMid) * 100 : 0
  const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`

  const baseAmount = amountInBase(point, isReversed)
  const usdAmount = baseAmount > 0 && baseUsdPrice !== undefined ? baseAmount * baseUsdPrice : undefined

  return (
    <Flex gap="$gap4">
      <TooltipRow
        label={t('common.range')}
        value={
          <Text variant="body4" color={color}>
            {pctStr}
          </Text>
        }
      />
      <TooltipRow
        label={t('common.price')}
        value={
          <SubscriptZeroPrice
            variant="body4"
            value={displayPrice}
            subscriptThreshold={6}
            symbol={quoteSymbol}
            disableTooltip
          />
        }
      />
      {baseAmount === 0 && feeTierLabel ? (
        <TooltipRow label={t('chart.type.depth.feeTier')} value={feeTierLabel} />
      ) : (
        <>
          {baseAmount !== 0 && (
            <TooltipRow
              label={t('common.amount')}
              value={
                <Text variant="body4">
                  {formatNumberOrString({ value: baseAmount, type: NumberType.TokenNonTx })} {baseSymbol}
                </Text>
              }
            />
          )}
          {usdAmount !== undefined && (
            <TooltipRow
              label={t('chart.type.depth.amountUSD', { symbol: usdSymbol ?? 'USDC' })}
              value={<Text variant="body4">{convertFiatAmountFormatted(usdAmount, NumberType.FiatTokenStats)}</Text>}
            />
          )}
        </>
      )}
    </Flex>
  )
}

export function DepthTooltipBody({
  data,
  pointByTime,
  tokenA,
  tokenB,
  isReversed,
  feeTierLabel,
  midPrice,
  sellColor,
  buyColor,
  baseUsdPrice,
  usdSymbol,
}: {
  data: DepthPoint
  pointByTime: Map<number, DepthPoint>
  tokenA: Currency
  tokenB: Currency
  isReversed: boolean
  feeTierLabel: string
  midPrice: number
  sellColor: string
  buyColor: string
  baseUsdPrice?: number
  usdSymbol?: string
}) {
  const full = pointByTime.get(data.time as number)!

  const color = full.side === 'sell' ? sellColor : buyColor

  return (
    <TooltipShell>
      <DepthSideTooltipContent
        point={full}
        tokenA={tokenA}
        tokenB={tokenB}
        isReversed={isReversed}
        midPrice={midPrice}
        color={color}
        feeTierLabel={feeTierLabel}
        baseUsdPrice={baseUsdPrice}
        usdSymbol={usdSymbol}
      />
    </TooltipShell>
  )
}

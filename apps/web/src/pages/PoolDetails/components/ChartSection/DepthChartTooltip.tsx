import { Currency } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import {
  DepthPoint,
  getDisplayPair,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'

const TooltipShell = ({ children }: { children: ReactNode }) => (
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

export function DepthTooltipBody({
  data,
  pointByTime,
  tokenA,
  tokenB,
  isReversed,
  gapTime,
  feeTierLabel,
}: {
  data: DepthPoint
  pointByTime: Map<number, DepthPoint>
  tokenA: Currency
  tokenB: Currency
  isReversed: boolean
  gapTime: number | null
  feeTierLabel: string
}) {
  const { t } = useTranslation()

  if (gapTime !== null && (data.time as number) === gapTime) {
    return (
      <TooltipShell>
        <TooltipRow label={t('chart.type.depth.feeTier')} value={feeTierLabel} />
      </TooltipShell>
    )
  }

  const full = pointByTime.get(data.time as number)
  if (!full) {
    return null
  }
  // Input physical token depends on which direction in tick-space we walked, not on display.
  const swapCurrency = full.inputIsToken0 ? tokenA : tokenB
  const swapSymbol = swapCurrency.symbol ?? swapCurrency.name ?? ''
  // Tooltip header always references the base token of the current (possibly reversed) display.
  const { base, quote } = getDisplayPair({ tokenA, tokenB, isReversed })
  const baseSymbol = base.symbol ?? base.name ?? ''
  const quoteSymbol = quote.symbol ?? quote.name ?? ''
  const displayPrice = toDisplayPrice(full.price, isReversed)
  return (
    <TooltipShell>
      <Text variant="body4" color={full.side === 'sell' ? '$statusCritical' : '$statusSuccess'}>
        {full.side === 'sell'
          ? t('chart.type.depth.sellToken', { symbol: baseSymbol })
          : t('chart.type.depth.buyToken', { symbol: baseSymbol })}
      </Text>
      <TooltipRow
        label={t('common.price')}
        value={
          <Flex row gap="$spacing4" alignItems="baseline">
            <Text variant="body4">{`1 ${baseSymbol} =`}</Text>
            <SubscriptZeroPrice
              variant="body4"
              value={displayPrice}
              subscriptThreshold={6}
              symbol={quoteSymbol}
              disableTooltip
            />
          </Flex>
        }
      />
      <TooltipRow
        label={t('chart.type.depth.swapToMove')}
        value={
          <SubscriptZeroPrice
            variant="body4"
            value={full.swapToMove}
            subscriptThreshold={6}
            symbol={swapSymbol}
            disableTooltip
          />
        }
      />
    </TooltipShell>
  )
}

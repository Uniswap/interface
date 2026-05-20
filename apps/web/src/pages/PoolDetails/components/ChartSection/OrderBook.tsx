import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TextProps, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { MIN_DEPTH_BARS_PER_SIDE } from '~/pages/PoolDetails/components/ChartSection/DepthChart'
import {
  getDisplayPair,
  priceFromTick,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'

type BookSide = 'ask' | 'bid'

type BookRow = {
  tick: number
  displayPrice: number
  amount: number
  total: number
  side: BookSide
}

const ROW_HEIGHT = 24

function buildOrderBook({
  barData,
  activeTick,
  token0Decimals,
  token1Decimals,
  isReversed,
}: {
  barData: { tick: number; liquidity: number; price0: string; amount0Locked: number; amount1Locked: number }[]
  activeTick: number
  token0Decimals: number
  token1Decimals: number
  isReversed: boolean
}): { asks: BookRow[]; bids: BookRow[]; midPrice: number } {
  const sorted = [...barData].sort((a, b) => a.tick - b.tick)
  const activeIdx = sorted.findIndex((d) => d.tick === activeTick)
  if (activeIdx === -1) {
    return { asks: [], bids: [], midPrice: 0 }
  }

  const midPrice0 = priceFromTick({ tick: activeTick, token0Decimals, token1Decimals })
  const midPrice = toDisplayPrice(midPrice0, isReversed)
  const baseIsToken0 = !isReversed

  const allRows: BookRow[] = []

  for (const bar of sorted) {
    if (bar.tick === activeTick) {
      continue
    }
    const price0 = priceFromTick({ tick: bar.tick, token0Decimals, token1Decimals })
    const displayPrice = toDisplayPrice(price0, isReversed)
    const aboveActive = bar.tick > activeTick

    // Amount in base token units.
    // Above active: token0 is locked. Below active: token1 is locked.
    let amount: number
    if (baseIsToken0) {
      amount = aboveActive ? bar.amount0Locked : price0 > 0 ? bar.amount1Locked / price0 : 0
    } else {
      amount = aboveActive ? bar.amount0Locked * price0 : bar.amount1Locked
    }

    if (amount <= 0 || !isFinite(amount)) {
      continue
    }

    // Skip ticks more than 50% away from mid — far-out ticks produce astronomically large
    // converted amounts that collapse all nearby bar widths to zero.
    if (midPrice > 0 && Math.abs(displayPrice - midPrice) / midPrice > 0.5) {
      continue
    }

    // Total = Price × Amount (non-cumulative, per row).
    const total = displayPrice * amount
    const side: BookSide = displayPrice > midPrice ? 'ask' : 'bid'
    allRows.push({ tick: bar.tick, displayPrice, amount, total, side })
  }

  // Asks: sorted descending (highest price at top, closest to mid at bottom).
  const asks = allRows.filter((r) => r.side === 'ask').sort((a, b) => b.displayPrice - a.displayPrice)

  // Bids: sorted descending (highest/closest to mid at top).
  const bids = allRows.filter((r) => r.side === 'bid').sort((a, b) => b.displayPrice - a.displayPrice)

  return { asks, bids, midPrice }
}

function BookRowItem({
  row,
  maxAmount,
  askColor,
  bidColor,
  formatAmount,
}: {
  row: BookRow
  maxAmount: number
  askColor: string
  bidColor: string
  formatAmount: (v: number) => string
}) {
  const barWidth = maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0
  const color = row.side === 'ask' ? askColor : bidColor
  const barColor = row.side === 'ask' ? opacify(20, askColor) : opacify(20, bidColor)

  return (
    <Flex position="relative" height={ROW_HEIGHT} justifyContent="center">
      <Flex
        position="absolute"
        right={0}
        top={0}
        bottom={0}
        backgroundColor={barColor}
        style={{ width: `${barWidth}%` }}
      />
      <Flex row px="$spacing8" zIndex={1}>
        <Flex width="34%">
          <SubscriptZeroPrice
            variant="body4"
            color={color}
            value={row.displayPrice}
            subscriptThreshold={6}
            maxSignificantDigits={6}
            disableTooltip
          />
        </Flex>
        <Flex width="33%" alignItems="flex-end">
          <Text variant="body4" color="$neutral1">
            {formatAmount(row.amount)}
          </Text>
        </Flex>
        <Flex width="33%" alignItems="flex-end">
          <Text variant="body4" color="$neutral2">
            {formatAmount(row.total)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function OrderBook({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
  onLoadingChange,
}: {
  tokenA: Currency
  tokenB: Currency
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
  onLoadingChange?: (loading: boolean) => void
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatNumberOrString } = useLocalizationContext()

  const askColor = colors.statusCritical.val
  const bidColor = colors.statusSuccess.val

  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: feeTier,
      chainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(tokenA),
      token1: getTokenOrZeroAddress(tokenB),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    true,
  )

  const sdkCurrencies = useMemo(() => ({ TOKEN0: tokenA, TOKEN1: tokenB }), [tokenA, tokenB])

  const { tickData, activeTick, loading } = useLiquidityBarData({
    sdkCurrencies,
    feeTier,
    isReversed,
    chainId,
    version,
    hooks,
    poolId,
    tickSpacing: poolData?.pools[0]?.tickSpacing,
  })

  const { asks, bids, midPrice } = useMemo(() => {
    if (!tickData?.barData || activeTick === undefined) {
      return { asks: [], bids: [], midPrice: 0 }
    }
    return buildOrderBook({
      barData: tickData.barData,
      activeTick,
      token0Decimals: tokenA.decimals,
      token1Decimals: tokenB.decimals,
      isReversed,
    })
  }, [tickData, activeTick, tokenA.decimals, tokenB.decimals, isReversed])

  useEffect(() => {
    onLoadingChange?.(loading)
  }, [loading, onLoadingChange])

  const { quote } = getDisplayPair({ tokenA, tokenB, isReversed })
  const quoteSymbol = quote.symbol ?? quote.name ?? t('common.tokenB')

  const maxAskAmount = useMemo(() => Math.max(...asks.map((r) => r.amount), 0), [asks])
  const maxBidAmount = useMemo(() => Math.max(...bids.map((r) => r.amount), 0), [bids])

  const formatAmount = (v: number) => formatNumberOrString({ value: v, type: NumberType.TokenNonTx })

  const scrollContainerRef = useRef<HTMLElement>(null)
  const midPriceRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (asks.length === 0) return
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      const midEl = midPriceRef.current
      if (!container || !midEl) return
      container.scrollTop = midEl.offsetTop - container.clientHeight / 2 + midEl.offsetHeight / 2
    })
  }, [asks, bids])

  const realAskBars = Math.max(0, asks.length)
  const realBidBars = Math.max(0, bids.length)
  if (loading || realAskBars < MIN_DEPTH_BARS_PER_SIDE || realBidBars < MIN_DEPTH_BARS_PER_SIDE) {
    return null
  }

  return (
    <Flex borderRadius="$rounded16" borderColor="$surface3" borderWidth="$spacing1" backgroundColor="$surface2">
      {/* Column headers */}
      <Flex row px="$padding8" pt="$padding16" pb="$padding4">
        <Flex width="34%">
          <Text variant="body4" color="$neutral2" numberOfLines={1}>
            {t('common.price')} ({quoteSymbol})
          </Text>
        </Flex>
        <Flex width="33%" alignItems="flex-end">
          <Text variant="body4" color="$neutral2" numberOfLines={1}>
            {t('common.amount')}
          </Text>
        </Flex>
        <Flex width="33%" alignItems="flex-end">
          <Text variant="body4" color="$neutral2" numberOfLines={1}>
            {t('common.total')}
          </Text>
        </Flex>
      </Flex>

      {/* Scrollable rows — overflowY scroll so scrollTop is directly settable */}
      <Flex
        ref={scrollContainerRef}
        maxHeight={480}
        style={{ overflowY: 'scroll', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}
      >
        {asks.map((row) => (
          <BookRowItem
            key={row.tick}
            row={row}
            maxAmount={maxAskAmount}
            askColor={askColor}
            bidColor={bidColor}
            formatAmount={formatAmount}
          />
        ))}

        <Flex ref={midPriceRef}>
          <Flex
            px="$padding8"
            py="$padding8"
            borderTopWidth="$spacing1"
            borderTopColor="$surface3"
            borderBottomWidth="$spacing1"
            borderBottomColor="$surface3"
          >
            <SubscriptZeroPrice
              variant="subheading2"
              color={bidColor as TextProps['color']}
              value={midPrice}
              subscriptThreshold={6}
              maxSignificantDigits={6}
              symbol={quoteSymbol}
              disableTooltip
            />
          </Flex>
        </Flex>

        {bids.map((row) => (
          <BookRowItem
            key={row.tick}
            row={row}
            maxAmount={maxBidAmount}
            askColor={askColor}
            bidColor={bidColor}
            formatAmount={formatAmount}
          />
        ))}
      </Flex>
    </Flex>
  )
}

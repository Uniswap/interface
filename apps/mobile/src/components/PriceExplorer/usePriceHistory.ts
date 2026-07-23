import { type GqlResult, GraphQLApi, isError, isNonPollingRequestInFlight } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import maxBy from 'lodash/maxBy'
import { type Dispatch, type SetStateAction, useCallback, useMemo, useRef, useState } from 'react'
import { type SharedValue, useDerivedValue } from 'react-native-reanimated'
import { type TLineChartData } from 'react-native-wagmi-charts'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'

export type TokenSpotData = {
  value: SharedValue<number>
  relativeChange: SharedValue<number | undefined>
}

export type PriceNumberOfDigits = {
  left: number
  right: number
}

type TokenPriceHistoryProject = NonNullable<NonNullable<GraphQLApi.TokenPriceHistoryQuery['tokenProjects']>[number]>
type TokenPriceHistoryMarket =
  | NonNullable<NonNullable<TokenPriceHistoryProject['markets']>[number]>
  | NonNullable<TokenPriceHistoryProject['tokens'][number]['market']>
type TokenPriceHistoryEntries = TokenPriceHistoryMarket['priceHistory']
type ConvertFiatAmount = ReturnType<typeof useLocalizationContext>['convertFiatAmount']

function resolvePriceHistorySources({
  currencyId,
  lastPrice,
  preferProjectMarketData,
  priceData,
}: {
  currencyId: string
  lastPrice: number | undefined
  preferProjectMarketData: boolean
  priceData: GraphQLApi.TokenPriceHistoryQuery | undefined
}): {
  price: number | undefined
  priceHistory: TokenPriceHistoryEntries
  pricePercentChange24h: number
} {
  const project = priceData?.tokenProjects?.[0]
  const projectMarket = project?.markets?.[0]
  const currentChain = toGraphQLChain(currencyIdToChain(currencyId) ?? UniverseChainId.Mainnet)
  const tokenMarket = project?.tokens.find((token) => token.chain === currentChain)?.market
  const primaryMarket = preferProjectMarketData ? projectMarket : tokenMarket
  const fallbackMarket = preferProjectMarketData ? tokenMarket : projectMarket

  return {
    price: primaryMarket?.price?.value ?? fallbackMarket?.price?.value ?? lastPrice,
    priceHistory: primaryMarket?.priceHistory ?? fallbackMarket?.priceHistory,
    pricePercentChange24h:
      projectMarket?.pricePercentChange24h?.value ?? tokenMarket?.pricePercentChange24h?.value ?? 0,
  }
}

function calculatePriceChange(priceHistory: TokenPriceHistoryEntries): number | undefined {
  if (!priceHistory || priceHistory.length === 0) {
    return undefined
  }
  const openPrice = priceHistory[0]?.value
  const closePrice = priceHistory[priceHistory.length - 1]?.value
  if (openPrice === undefined || closePrice === undefined || openPrice === 0) {
    return undefined
  }
  return ((closePrice - openPrice) / openPrice) * 100
}

function getNumberOfDigits({
  convertFiatAmount,
  lastNumberOfDigits,
  price,
  priceHistory,
}: {
  convertFiatAmount: ConvertFiatAmount
  lastNumberOfDigits: PriceNumberOfDigits
  price: number | undefined
  priceHistory: TokenPriceHistoryEntries
}): PriceNumberOfDigits {
  const maxPriceInHistory = maxBy(priceHistory, 'value')?.value
  if (!maxPriceInHistory && price === undefined) {
    return lastNumberOfDigits
  }

  const maxPrice = Math.max(maxPriceInHistory || 0, price || 0)
  const convertedMaxValue = convertFiatAmount(maxPrice).amount

  return {
    left: String(convertedMaxValue).split('.')[0]?.length || 10,
    right: Number(String(convertedMaxValue.toFixed(16)).split('.')[0]) > 0 ? 2 : 16,
  }
}

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory({
  currencyId,
  initialDuration = GraphQLApi.HistoryDuration.Day,
  preferProjectMarketData = false,
  skip = false,
}: {
  currencyId: string
  initialDuration?: GraphQLApi.HistoryDuration
  preferProjectMarketData?: boolean
  skip?: boolean
}): Omit<
  GqlResult<{
    priceHistory?: TLineChartData
    spot?: TokenSpotData
  }>,
  'error'
> & {
  setDuration: Dispatch<SetStateAction<GraphQLApi.HistoryDuration>>
  selectedDuration: GraphQLApi.HistoryDuration
  error: boolean
  numberOfDigits: PriceNumberOfDigits
} {
  const lastPrice = useRef<undefined | number>(undefined)
  const hasEverLoadedRef = useRef(false)
  const lastNumberOfDigits = useRef({
    left: 0,
    right: 0,
  })
  const [duration, setDuration] = useState(initialDuration)
  const { convertFiatAmount } = useLocalizationContext()
  // The TDP heartbeat coordinator only takes over refreshing when this flag is on —
  // otherwise this query must keep its own poll running, or it would never refresh.
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const {
    data: priceData,
    refetch,
    networkStatus,
  } = GraphQLApi.useTokenPriceHistoryQuery({
    variables: {
      contract: currencyIdToContractInput(currencyId),
      duration,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    pollInterval: isDataLivelinessEnabled ? undefined : PollingInterval.Normal,
    skip,
  })

  const { price, priceHistory, pricePercentChange24h } = resolvePriceHistorySources({
    currencyId,
    lastPrice: lastPrice.current,
    preferProjectMarketData,
    priceData,
  })
  lastPrice.current = price
  if (price !== undefined) {
    hasEverLoadedRef.current = true
  }

  const calculatedPriceChange = useMemo(() => calculatePriceChange(priceHistory), [priceHistory])

  // Use API's 24hr change for 1d, calculated change for other durations
  const priceChange = duration === GraphQLApi.HistoryDuration.Day ? pricePercentChange24h : calculatedPriceChange

  const spotValue = useDerivedValue(() => price ?? 0)
  const spotRelativeChange = useDerivedValue(() => priceChange)

  const spot = useMemo(
    () =>
      price !== undefined
        ? {
            value: spotValue,
            relativeChange: spotRelativeChange,
          }
        : undefined,
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    [price, priceChange, spotValue, spotRelativeChange],
  )

  const formattedPriceHistory = useMemo(() => {
    const formatted = priceHistory
      ?.filter((x): x is GraphQLApi.TimestampedAmount => Boolean(x))
      .map((x) => ({ timestamp: x.timestamp * 1000, value: x.value }))

    return formatted
  }, [priceHistory])

  const data = useMemo(
    () => ({
      priceHistory: formattedPriceHistory,
      spot,
    }),
    [formattedPriceHistory, spot],
  )

  const numberOfDigits = useMemo(() => {
    const newNumberOfDigits = getNumberOfDigits({
      convertFiatAmount,
      lastNumberOfDigits: lastNumberOfDigits.current,
      price,
      priceHistory,
    })
    lastNumberOfDigits.current = newNumberOfDigits

    return newNumberOfDigits
  }, [convertFiatAmount, priceHistory, price])

  const retry = useCallback(async () => {
    await refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  return {
    data,
    loading: skip || (isNonPollingRequestInFlight(networkStatus) && !hasEverLoadedRef.current),
    error: !skip && isError(networkStatus, !!priceData),
    refetch: retry,
    setDuration,
    selectedDuration: duration,
    numberOfDigits,
  }
}

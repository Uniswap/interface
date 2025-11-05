import { type GqlResult, GraphQLApi, isError, isNonPollingRequestInFlight } from '@universe/api'
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
  relativeChange: SharedValue<number>
}

export type PriceNumberOfDigits = {
  left: number
  right: number
}

/**
 * @returns Token price history for requested duration
 */
export function useTokenPriceHistory({
  currencyId,
  initialDuration = GraphQLApi.HistoryDuration.Day,
  skip = false,
}: {
  currencyId: string
  initialDuration?: GraphQLApi.HistoryDuration
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
  const lastNumberOfDigits = useRef({
    left: 0,
    right: 0,
  })
  const [duration, setDuration] = useState(initialDuration)
  const { convertFiatAmount } = useLocalizationContext()

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
    pollInterval: PollingInterval.Normal,
    fetchPolicy: 'network-only',
    skip,
  })

  // Data source strategy for multi-chain tokens:
  // - Use PER-CHAIN data (token.market) for price and price history to show the correct chain-specific view
  // - Fallback to AGGREGATED data (project.markets) when per-chain history is unavailable
  // - Continue using aggregated 24hr change for consistency across platforms
  // Note: TokenProjectMarket is aggregated across chains, TokenMarket is per-chain
  const offChainData = priceData?.tokenProjects?.[0]?.markets?.[0]

  // We need to find the specific token for the chain we're viewing
  const currentChain = toGraphQLChain(currencyIdToChain(currencyId) ?? UniverseChainId.Mainnet)
  const currentChainToken = priceData?.tokenProjects?.[0]?.tokens.find((token) => token.chain === currentChain)
  const onChainData = currentChainToken?.market

  // Use per-chain price to ensure correct price on each chain (e.g., USDC on Ethereum vs Polygon)
  const price = onChainData?.price?.value ?? offChainData?.price?.value ?? lastPrice.current
  lastPrice.current = price

  // Prefer per-chain price history so multi-chain tokens render the correct chart for the selected chain
  const priceHistory = onChainData?.priceHistory ?? offChainData?.priceHistory

  // Use aggregated 24hr change (project-level change is more reliable)
  const pricePercentChange24h =
    offChainData?.pricePercentChange24h?.value ?? onChainData?.pricePercentChange24h?.value ?? 0

  const spotValue = useDerivedValue(() => price ?? 0)
  const spotRelativeChange = useDerivedValue(() => pricePercentChange24h)

  const spot = useMemo(
    () =>
      price !== undefined
        ? {
            value: spotValue,
            relativeChange: spotRelativeChange,
          }
        : undefined,
    [price],
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
    const maxPriceInHistory = maxBy(priceHistory, 'value')?.value
    // If there is neither max price in history nor current price, return last number of digits
    if (!maxPriceInHistory && price === undefined) {
      return lastNumberOfDigits.current
    }

    const maxPrice = Math.max(maxPriceInHistory || 0, price || 0)
    const convertedMaxValue = convertFiatAmount(maxPrice).amount

    const newNumberOfDigits = {
      left: String(convertedMaxValue).split('.')[0]?.length || 10,
      right: Number(String(convertedMaxValue.toFixed(16)).split('.')[0]) > 0 ? 2 : 16,
    }
    lastNumberOfDigits.current = newNumberOfDigits

    return newNumberOfDigits
  }, [convertFiatAmount, priceHistory, price])

  const retry = useCallback(async () => {
    await refetch({ contract: currencyIdToContractInput(currencyId) })
  }, [refetch, currencyId])

  return {
    data,
    loading: skip || isNonPollingRequestInFlight(networkStatus),
    error: !skip && isError(networkStatus, !!priceData),
    refetch: retry,
    setDuration,
    selectedDuration: duration,
    numberOfDigits,
  }
}

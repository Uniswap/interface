// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { TICK_SPACINGS, TickMath, nearestUsableTick } from '@uniswap/v3-sdk'
import { getPoolFromRest, parseV3FeeTier } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PositionInfo, PositionState, PriceRangeInfo, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import { tryParseTick } from 'state/mint/v3/utils'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getTickToPrice } from 'utils/getTickToPrice'

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(state: PositionState): PositionInfo {
  const { chainId } = useAccount()

  const { TOKEN0, TOKEN1 } = state.currencyInputs

  const tokens = useMemo(
    () =>
      TOKEN0 && TOKEN1
        ? [TOKEN0?.isNative ? TOKEN0.wrapped : TOKEN0, TOKEN1?.isNative ? TOKEN1.wrapped : TOKEN1]
        : undefined,
    [TOKEN0, TOKEN1],
  )
  const sortedTokens = tokens && tokens.toSorted((a, b) => (!b ? -1 : a?.sortsBefore(b) ? -1 : 1))

  const data = usePool(
    sortedTokens?.[0],
    sortedTokens?.[1],
    state.fee,
    chainId ?? (UniverseChainId.Mainnet as number),
    state.protocolVersion,
  )

  const pool = getPoolFromRest({ pool: data, token0: sortedTokens?.[0], token1: sortedTokens?.[1] })

  return useMemo(
    () => ({
      pool,
      tokens,
      sortedTokens,
    }),
    [pool, tokens, sortedTokens],
  )
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const {
    positionState: { fee },
    derivedPositionInfo: { tokens, sortedTokens, pool },
  } = useCreatePositionContext()

  const [sortedToken0, sortedToken1] = sortedTokens ?? [undefined, undefined]
  const [baseToken, quoteToken] = tokens
    ? state.priceInverted
      ? [tokens?.[1], tokens?.[0]]
      : tokens
    : [undefined, undefined]

  const parsedV3FeeTier = parseV3FeeTier(fee.toString())
  const tickSpaceLimits = useMemo(
    () => [
      parsedV3FeeTier ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[parsedV3FeeTier]) : undefined,
      parsedV3FeeTier ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[parsedV3FeeTier]) : undefined,
    ],
    [parsedV3FeeTier],
  )

  const invertPrice = Boolean(baseToken && sortedToken0 && !baseToken.equals(sortedToken0))
  const [baseRangeInput, quoteRangeInput] = invertPrice
    ? [state.maxPrice, state.minPrice]
    : [state.minPrice, state.maxPrice]
  const lowerTick =
    baseRangeInput === ''
      ? tickSpaceLimits[0]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee, state.maxPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee, state.minPrice)
  const upperTick =
    quoteRangeInput === ''
      ? tickSpaceLimits[1]
      : invertPrice
        ? tryParseTick(sortedToken1, sortedToken0, fee, state.minPrice)
        : tryParseTick(sortedToken0, sortedToken1, fee, state.maxPrice)
  const ticks = useMemo(() => [lowerTick, upperTick], [lowerTick, upperTick])

  const ticksAtLimit = useMemo(
    () => (state.fullRange ? [true, true] : [lowerTick === tickSpaceLimits[0], upperTick === tickSpaceLimits[1]]),
    [lowerTick, state.fullRange, tickSpaceLimits, upperTick],
  )

  const pricesAtLimit = useMemo(
    () => [
      getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[0]),
      getTickToPrice(sortedToken0, sortedToken1, tickSpaceLimits[1]),
    ],
    [sortedToken0, sortedToken1, tickSpaceLimits],
  )

  const pricesAtTicks = useMemo(
    () => [getTickToPrice(sortedToken0, sortedToken1, ticks[0]), getTickToPrice(sortedToken0, sortedToken1, ticks[1])],
    [sortedToken0, sortedToken1, ticks],
  )

  const baseAndQuoteTokens = useMemo(
    () => (baseToken && quoteToken ? [baseToken, quoteToken] : undefined),
    [baseToken, quoteToken],
  )

  const isSorted = useMemo(() => {
    if (!baseToken || !quoteToken) {
      return false
    }

    return baseToken.sortsBefore(quoteToken)
  }, [baseToken, quoteToken])

  const prices = useMemo(() => {
    if (!baseToken || !quoteToken) {
      return [undefined, undefined]
    }

    const lowerPrice = state.fullRange ? pricesAtLimit[0] : pricesAtTicks[0]
    const upperPrice = state.fullRange ? pricesAtLimit[1] : pricesAtTicks[1]

    const minPrice = isSorted ? lowerPrice : upperPrice?.invert()
    const maxPrice = isSorted ? upperPrice : lowerPrice?.invert()

    return [minPrice, maxPrice]
  }, [baseToken, isSorted, pricesAtLimit, pricesAtTicks, quoteToken, state.fullRange])

  const price = useMemo(() => {
    if (!pool || !baseToken || !quoteToken) {
      return undefined
    }

    const isSorted = baseToken.sortsBefore(quoteToken)
    return isSorted ? pool.token0Price : pool.token1Price
  }, [baseToken, pool, quoteToken])

  return useMemo(
    () => ({
      ticks,
      ticksAtLimit,
      isSorted,
      price,
      prices,
      pricesAtTicks,
      pricesAtLimit,
      baseAndQuoteTokens,
    }),
    [baseAndQuoteTokens, isSorted, price, prices, pricesAtLimit, pricesAtTicks, ticks, ticksAtLimit],
  )
}

export function usePool(
  token0: Currency | undefined,
  token1: Currency | undefined,
  fee: number | undefined,
  chainId: number | undefined,
  protocolVersion: ProtocolVersion | undefined,
) {
  const tokens = [token0?.isNative ? token0.wrapped : token0, token1?.isNative ? token1.wrapped : token1]
  const sortedTokens = tokens.sort((a, b) => (!b ? -1 : a?.sortsBefore(b) ? -1 : 1))
  const { data } = useGetPoolsByTokens(
    token0 && token1 && chainId && protocolVersion
      ? {
          fee,
          chainId,
          protocolVersions: [protocolVersion],
          token0: sortedTokens[0]?.address,
          token1: sortedTokens[1]?.address,
        }
      : undefined,
  )

  return data?.pools?.[0]
}

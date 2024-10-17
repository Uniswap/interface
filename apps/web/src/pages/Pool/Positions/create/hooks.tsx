// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { Pair, computePairAddress } from '@uniswap/v2-sdk'
import { Pool, Position, TICK_SPACINGS, TickMath, nearestUsableTick } from '@uniswap/v3-sdk'
import { DepositInfo, DepositState } from 'components/Liquidity/types'
import { getPairFromRest, getPoolFromRest, parseV3FeeTier } from 'components/Liquidity/utils'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PositionInfo, PositionState, PriceRangeInfo, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import { tryParseTick } from 'state/mint/v3/utils'
import { PositionField } from 'types/position'
import { useGetPair } from 'uniswap/src/data/rest/getPair'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getTickToPrice } from 'utils/getTickToPrice'

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(state: PositionState): PositionInfo {
  const { chainId } = useAccount()
  const {
    currencyInputs: { TOKEN0: token0Input, TOKEN1: token1Input },
    protocolVersion,
  } = state

  const inputCurrencyInfo = useCurrencyInfo(token0Input)
  const outputCurrencyInfo = useCurrencyInfo(token1Input)
  const currencies = useMemo(
    () => ({ TOKEN0: inputCurrencyInfo?.currency, TOKEN1: outputCurrencyInfo?.currency }),
    [inputCurrencyInfo, outputCurrencyInfo],
  )

  const { TOKEN0, TOKEN1 } = currencies
  const tokens = useMemo(
    () =>
      TOKEN0 && TOKEN1
        ? [TOKEN0?.isNative ? TOKEN0.wrapped : TOKEN0, TOKEN1?.isNative ? TOKEN1.wrapped : TOKEN1]
        : undefined,
    [TOKEN0, TOKEN1],
  )
  const sortedTokens = tokens && tokens.toSorted((a, b) => (!b ? -1 : a?.sortsBefore(b) ? -1 : 1))

  const poolsQueryEnabled = protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: state.fee,
      chainId,
      protocolVersions: [protocolVersion],
      token0: sortedTokens?.[0].address,
      token1: sortedTokens?.[1].address,
    },
    poolsQueryEnabled,
  )

  const pool = useMemo(() => {
    return getPoolFromRest({ pool: poolData?.pools?.[0], token0: sortedTokens?.[0], token1: sortedTokens?.[1] })
  }, [poolData?.pools, sortedTokens])

  const pairsQueryEnabled = protocolVersion === ProtocolVersion.V2
  const pairAddress = useMemo(() => {
    return sortedTokens && sortedTokens[0] && sortedTokens[1]
      ? computePairAddress({
          factoryAddress: V2_FACTORY_ADDRESSES[sortedTokens[0].chainId],
          tokenA: sortedTokens[0],
          tokenB: sortedTokens[1],
        })
      : undefined
  }, [sortedTokens])

  const { data: pairData } = useGetPair(
    {
      chainId: chainId ?? (UniverseChainId.Mainnet as number),
      pairAddress,
    },
    pairsQueryEnabled,
  )

  const pair = useMemo(() => {
    if (!sortedTokens || !sortedTokens[0] || !sortedTokens[1]) {
      return undefined
    }

    return getPairFromRest({ pair: pairData?.pair, token0: sortedTokens[0], token1: sortedTokens[1] })
  }, [pairData, sortedTokens])

  return useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
      return {
        currencies,
        protocolVersion,
        pair: pair ?? undefined,
        tokens,
        sortedTokens,
      }
    }

    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies,
        protocolVersion: ProtocolVersion.UNSPECIFIED,
      }
    }

    return {
      currencies,
      protocolVersion,
      pool,
      tokens,
      sortedTokens,
    }
  }, [protocolVersion, currencies, pool, tokens, sortedTokens, pair])
}

export function useDerivedPriceRangeInfo(state: PriceRangeState): PriceRangeInfo {
  const {
    positionState: { fee },
    derivedPositionInfo,
  } = useCreatePositionContext()

  const { sortedTokens, tokens, protocolVersion } = derivedPositionInfo
  const pool =
    protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
      ? derivedPositionInfo.pool
      : undefined

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
      tickSpaceLimits,
      baseAndQuoteTokens,
      invertPrice,
    }),
    [
      baseAndQuoteTokens,
      isSorted,
      price,
      prices,
      pricesAtLimit,
      pricesAtTicks,
      ticks,
      ticksAtLimit,
      invertPrice,
      tickSpaceLimits,
    ],
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

export type UseDepositInfoProps = {
  protocolVersion: ProtocolVersion
  address?: string
  token0?: Currency
  token1?: Currency
  exactField: PositionField
  exactAmount?: string
} & (
  | {
      protocolVersion: ProtocolVersion.V3 | ProtocolVersion.V4
      pool?: Pool
      tickLower?: number
      tickUpper?: number
    }
  | {
      protocolVersion: ProtocolVersion.V2
      pair?: Pair
    }
  | {
      protocolVersion: ProtocolVersion.UNSPECIFIED
    }
)

export function useDerivedDepositInfo(state: DepositState): DepositInfo {
  const account = useAccount()
  const { derivedPositionInfo } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo: { ticks },
  } = usePriceRangeContext()
  const { exactAmount, exactField } = state
  const { protocolVersion, sortedTokens } = derivedPositionInfo

  const pool =
    protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
      ? derivedPositionInfo.pool
      : undefined

  const pair = protocolVersion === ProtocolVersion.V2 ? derivedPositionInfo.pair : undefined

  const [token0, token1] = sortedTokens ?? [undefined, undefined]
  const tickLower = ticks?.[0]
  const tickUpper = ticks?.[1]

  const depositInfoProps: UseDepositInfoProps = useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        protocolVersion,
        exactField,
      }
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return {
        protocolVersion,
        pair,
        address: account.address,
        token0,
        token1,
        exactField,
        exactAmount,
      }
    }

    return {
      protocolVersion,
      pool,
      address: account.address,
      tickLower,
      tickUpper,
      token0,
      token1,
      exactField,
      exactAmount,
    }
  }, [account.address, exactAmount, exactField, pair, pool, protocolVersion, tickLower, tickUpper, token0, token1])

  return useDepositInfo(depositInfoProps)
}

export function useDepositInfo(state: UseDepositInfoProps): DepositInfo {
  const { protocolVersion, address, token0, token1, exactField, exactAmount } = state
  const [token0Balance, token1Balance] = useCurrencyBalances(address, [token0, token1])

  const [independentToken, dependentToken] = exactField === PositionField.TOKEN0 ? [token0, token1] : [token1, token0]
  const independentAmount = tryParseCurrencyAmount(exactAmount, independentToken)

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    const wrappedIndependentAmount = independentAmount?.wrapped

    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return undefined
    }

    if (protocolVersion === ProtocolVersion.V2) {
      const pair = state.pair
      const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]

      if (token0Wrapped && token1Wrapped && wrappedIndependentAmount && pair) {
        const dependentTokenAmount =
          exactField === PositionField.TOKEN0
            ? pair.priceOf(token0Wrapped).quote(wrappedIndependentAmount)
            : pair.priceOf(token1Wrapped).quote(wrappedIndependentAmount)
        return dependentToken?.isNative
          ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
          : dependentTokenAmount
      }

      return undefined
    }

    const { tickLower, tickUpper, pool } = state

    if (!tickLower || !tickUpper || !pool || !independentAmount || !wrappedIndependentAmount) {
      return undefined
    }

    const position: Position | undefined = wrappedIndependentAmount.currency.equals(pool.token0)
      ? Position.fromAmount0({
          pool,
          tickLower,
          tickUpper,
          amount0: independentAmount.quotient,
          useFullPrecision: true,
        })
      : Position.fromAmount1({
          pool,
          tickLower,
          tickUpper,
          amount1: independentAmount.quotient,
        })

    const dependentTokenAmount = wrappedIndependentAmount.currency.equals(pool.token0)
      ? position.amount1
      : position.amount0
    return dependentToken && CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
  }, [independentAmount, protocolVersion, state, dependentToken, token0?.wrapped, token1?.wrapped, exactField])

  const independentTokenUSDValue = useUSDCValue(independentAmount) || undefined
  const dependentTokenUSDValue = useUSDCValue(dependentAmount) || undefined

  const dependentField = exactField === PositionField.TOKEN0 ? PositionField.TOKEN1 : PositionField.TOKEN0
  return useMemo(
    () => ({
      currencyBalances: { [PositionField.TOKEN0]: token0Balance, [PositionField.TOKEN1]: token1Balance },
      formattedAmounts: { [exactField]: exactAmount, [dependentField]: dependentAmount?.toExact() },
      currencyAmounts: { [exactField]: independentAmount, [dependentField]: dependentAmount },
      currencyAmountsUSDValue: { [exactField]: independentTokenUSDValue, [dependentField]: dependentTokenUSDValue },
    }),
    [
      token0Balance,
      token1Balance,
      exactAmount,
      dependentAmount,
      independentAmount,
      independentTokenUSDValue,
      dependentTokenUSDValue,
      exactField,
      dependentField,
    ],
  )
}

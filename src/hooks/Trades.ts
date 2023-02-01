import { Pair, Trade } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Token, TradeType } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { ENV_LEVEL } from 'constants/env'
import { ZERO_ADDRESS, ZERO_ADDRESS_SOLANA } from 'constants/index'
import { ENV_TYPE } from 'constants/type'
import { PairState, usePairs } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks/index'
import { useAllCurrencyCombinations } from 'hooks/useAllCurrencyCombinations'
import useDebounce from 'hooks/useDebounce'
import { AppState } from 'state'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'
import { useEncodeSolana, useSwapState } from 'state/swap/hooks'
import { AggregationComparer } from 'state/swap/types'
import { useAllTransactions } from 'state/transactions/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress } from 'utils'
import { Aggregator } from 'utils/aggregator'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[][] {
  const allPairCombinations = useAllCurrencyCombinations(currencyA, currencyB)

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      allPairs.reduce<Pair[][]>((res, poolArray) => {
        const t = Object.values(
          poolArray
            .filter((result): result is [PairState.EXISTS, Pair] =>
              Boolean(result[0] === PairState.EXISTS && result[1]),
            )
            .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
              memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
              return memo
            }, {}),
        )
        res.push(t)
        return res
      }, []),
    [allPairs],
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
): Trade<Currency, Currency, TradeType> | null {
  const currencyIn = useMemo(() => currencyAmountIn?.currency, [currencyAmountIn])
  const allCommonPairs = useAllCommonPairs(currencyIn, currencyOut)
  const allowedPairs = useMemo(() => allCommonPairs.filter(item => item.length > 0), [allCommonPairs])
  const [trade, setTrade] = useState<Trade<Currency, Currency, TradeType> | null>(null)

  useEffect(() => {
    let timeout: any
    const fn = async function () {
      timeout = setTimeout(() => {
        if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
          if (ENV_LEVEL < ENV_TYPE.PROD) {
            console.log('trade amount: ', currencyAmountIn.toSignificant(10))
          }

          setTrade(
            Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
              maxHops: 3,
              maxNumResults: 1,
            })[0] ?? null,
          )
        } else setTrade(null)
      }, 100)
    }
    fn()
    return () => {
      clearTimeout(timeout)
    }
  }, [currencyAmountIn, currencyOut, allowedPairs])

  return trade
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactInV2(
  currencyAmountIn: CurrencyAmount<Currency> | undefined,
  currencyOut: Currency | undefined,
  recipient: string | null,
): {
  trade: Aggregator | null
  comparer: AggregationComparer | null
  onUpdateCallback: (resetRoute: boolean, minimumLoadingTime: number) => void
  loading: boolean
} {
  const { account, chainId, networkInfo, isEVM } = useActiveWeb3React()
  const controller = useRef(new AbortController())
  const [allowedSlippage] = useUserSlippageTolerance()
  const txsInChain = useAllTransactions()
  const [, setEncodeSolana] = useEncodeSolana()

  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  const selectedDexes = allDexes?.filter(item => !excludeDexes.includes(item.id)).map(item => item.id)

  const dexes =
    selectedDexes?.length === allDexes?.length
      ? ''
      : selectedDexes?.join(',').replace('kyberswapv1', 'kyberswap,kyberswap-static') || ''

  const [trade, setTrade] = useState<Aggregator | null>(null)
  const [comparer, setComparer] = useState<AggregationComparer | null>(null)
  const [loading, setLoading] = useState(false)

  const debounceCurrencyAmountIn = useDebounce(currencyAmountIn, 100)

  const ttl = useSelector<AppState, number>(state => state.user.userDeadline)

  const { feeConfig, saveGas } = useSwapState()

  // refresh aggregator data on new sent tx
  const allTxGroup = useMemo(() => JSON.stringify(Object.keys(txsInChain || {})), [txsInChain])

  const onUpdateCallback = useCallback(
    async (resetRoute: boolean, minimumLoadingTime: number) => {
      if (
        debounceCurrencyAmountIn &&
        currencyOut &&
        (debounceCurrencyAmountIn.currency as Token)?.address !== (currencyOut as Token)?.address
      ) {
        if (resetRoute) setTrade(null)
        controller.current.abort()

        controller.current = new AbortController()
        const signal = controller.current.signal

        setLoading(true)

        const to =
          (isAddress(chainId, recipient) ? (recipient as string) : account) ??
          (isEVM ? ZERO_ADDRESS : ZERO_ADDRESS_SOLANA)

        const deadline = Math.round(Date.now() / 1000) + ttl

        const [state, comparedResult] = await Promise.all([
          Aggregator.bestTradeExactIn(
            networkInfo.routerUri,
            debounceCurrencyAmountIn,
            currencyOut,
            saveGas,
            dexes,
            allowedSlippage,
            deadline,
            to,
            feeConfig,
            signal,
            minimumLoadingTime,
          ),
          Aggregator.compareDex(
            networkInfo.routerUri,
            debounceCurrencyAmountIn,
            currencyOut,
            allowedSlippage,
            deadline,
            to,
            feeConfig,
            signal,
            minimumLoadingTime,
          ),
        ])

        if (!signal.aborted) {
          setTrade(prev => {
            try {
              if (JSON.stringify(prev) !== JSON.stringify(state)) return state
            } catch (e) {
              return state
            }
            return prev
          })
          setComparer(prev => {
            try {
              if (JSON.stringify(prev) !== JSON.stringify(comparedResult)) return comparedResult
            } catch (e) {
              return comparedResult
            }
            return prev
          })
        }
        setLoading(false)
        // if (!signal.aborted && state) {
        //   const swap = await state.solana?.swap
        //   if (swap) setTrade(state)
        // }
      } else {
        setTrade(null)
        setComparer(null)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isEVM,
      allTxGroup, // required. Refresh aggregator data after swap.
      debounceCurrencyAmountIn,
      currencyOut,
      chainId,
      recipient,
      account,
      ttl,
      networkInfo.routerUri,
      saveGas,
      dexes,
      allowedSlippage,
      feeConfig,
    ],
  )

  useEffect(() => {
    onUpdateCallback(false, 0)
  }, [onUpdateCallback])

  useEffect(() => {
    const controller = new AbortController()
    const encodeSolana = async () => {
      if (!trade) return
      const encodeSolana = await Aggregator.encodeSolana(trade, controller.signal)
      if (encodeSolana && !controller.signal.aborted) setEncodeSolana(encodeSolana)
    }
    encodeSolana()

    return () => {
      controller.abort()
    }
  }, [trade, setEncodeSolana])

  return {
    trade, //todo: not return this anymore, set & use it from redux
    comparer,
    onUpdateCallback,
    loading,
  }
}

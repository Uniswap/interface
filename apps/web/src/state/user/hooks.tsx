/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { gqlToCurrency } from 'appGraphql/data/util'
import { Percent, Token, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress, Pair } from '@uniswap/v2-sdk'
import { GraphQLApi } from '@universe/api'
import { L2_DEADLINE_FROM_NOW } from 'constants/misc'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from 'constants/routing'
import { useAccount } from 'hooks/useAccount'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { RouterPreference } from 'state/routing/types'
import {
  addSerializedPair,
  updateUserDeadline,
  updateUserRouterPreference,
  updateUserSlippageTolerance,
} from 'state/user/reducer'
import { SerializedPair, SlippageTolerance } from 'state/user/types'
import { useGetPositionsForPairs } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isL2ChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { deserializeToken, serializeToken } from 'uniswap/src/utils/currency'

export function useRouterPreference(): [RouterPreference, (routerPreference: RouterPreference) => void] {
  const dispatch = useAppDispatch()

  const routerPreference = useAppSelector((state) => state.user.userRouterPreference)

  const setRouterPreference = useCallback(
    (newRouterPreference: RouterPreference) => {
      dispatch(updateUserRouterPreference({ userRouterPreference: newRouterPreference }))
    },
    [dispatch],
  )

  return [routerPreference, setRouterPreference]
}

/**
 * Return the user's slippage tolerance, from the redux store, and a function to update the slippage tolerance
 */
export function useUserSlippageTolerance(): [
  Percent | SlippageTolerance.Auto,
  (slippageTolerance: Percent | SlippageTolerance.Auto) => void,
] {
  const userSlippageToleranceRaw = useAppSelector((state) => {
    return state.user.userSlippageTolerance
  })

  const userSlippageTolerance = useMemo(
    () =>
      userSlippageToleranceRaw === SlippageTolerance.Auto
        ? SlippageTolerance.Auto
        : new Percent(userSlippageToleranceRaw, 10_000),
    [userSlippageToleranceRaw],
  )

  const dispatch = useAppDispatch()
  const setUserSlippageTolerance = useCallback(
    (userSlippageTolerance: Percent | SlippageTolerance.Auto) => {
      let value: SlippageTolerance.Auto | number
      try {
        value =
          userSlippageTolerance === SlippageTolerance.Auto
            ? SlippageTolerance.Auto
            : JSBI.toNumber(userSlippageTolerance.multiply(10_000).quotient)
      } catch {
        value = SlippageTolerance.Auto
      }
      dispatch(
        updateUserSlippageTolerance({
          userSlippageTolerance: value,
        }),
      )
    },
    [dispatch],
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}

/**
 *Returns user slippage tolerance, replacing the auto with a default value
 * @param defaultSlippageTolerance the value to replace auto with
 */
export function useUserSlippageToleranceWithDefault(defaultSlippageTolerance: Percent): Percent {
  const [allowedSlippage] = useUserSlippageTolerance()
  return allowedSlippage === SlippageTolerance.Auto ? defaultSlippageTolerance : allowedSlippage
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const { chainId } = useAccount()
  const dispatch = useAppDispatch()
  const userDeadline = useAppSelector((state) => state.user.userDeadline)
  const onL2 = isL2ChainId(chainId)
  const deadline = onL2 ? L2_DEADLINE_FROM_NOW : userDeadline

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch],
  )

  return [deadline, setUserDeadline]
}

function serializePair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1),
  }
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch],
  )
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toV2LiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  if (tokenA.chainId !== tokenB.chainId) {
    throw new Error('Not matching chain IDs')
  }
  if (tokenA.equals(tokenB)) {
    throw new Error('Tokens cannot be equal')
  }
  if (!V2_FACTORY_ADDRESSES[tokenA.chainId]) {
    throw new Error('No V2 factory address on this chain')
  }

  return new Token(
    tokenA.chainId,
    computePairAddress({ factoryAddress: V2_FACTORY_ADDRESSES[tokenA.chainId], tokenA, tokenB }),
    18,
    'UNI-V2',
    'Uniswap V2',
  )
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useAccount()
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = useSupportedChainId(chainId)

  // TODO(WEB-4001): use an "all tokens" query for better LP detection
  const { data: popularTokens } = GraphQLApi.useTopTokensQuery({
    variables: {
      chain: toGraphQLChain(supportedChainId ?? defaultChainId),
      orderBy: GraphQLApi.TokenSortableField.Popularity,
      page: 1,
      pageSize: 100,
    },
  })

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? (PINNED_PAIRS[chainId] ?? []) : []), [chainId])

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId && popularTokens?.topTokens
        ? popularTokens.topTokens.flatMap((gqlToken) => {
            if (!gqlToken || !gqlToken.address) {
              return []
            }
            const token = gqlToCurrency(gqlToken)
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                .map((base) => {
                  if (!token?.isNative && base.address === token?.address) {
                    return null
                  } else {
                    return [base, token]
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            )
          })
        : [],
    [popularTokens, chainId],
  )

  // pairs saved by users
  const savedSerializedPairs = useAppSelector(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) {
      return []
    }
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) {
      return []
    }

    return Object.keys(forChain).map((pairId) => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(
    () => userPairs.concat(generatedPairs).concat(pinnedPairs),
    [pinnedPairs, userPairs, generatedPairs],
  )

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) {
        return memo
      }
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map((key) => keyed[key])
  }, [combinedList])
}

export function useRequestPositionsForSavedPairs() {
  const savedSerializedPairs = useAppSelector(({ user: { pairs } }) => pairs)
  const account = useAccount()
  return useGetPositionsForPairs(savedSerializedPairs, account.address)
}

import { ChainId, Pair, Token } from '@swapr/sdk'
import flatMap from 'lodash.flatmap'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from '../../constants'
import { PairState, usePairs } from '../../data/Reserves'

import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { MainnetGasPrice } from '../application/actions'
import { AppDispatch, AppState } from '../index'
import {
  addSerializedPair,
  addSerializedToken,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserSlippageTolerance,
  toggleURLWarning,
  removeSerializedPair,
  updateUserMultihop,
  updateUserPreferredGasPrice
} from './actions'

function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

function serializeSimplifiedPair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1)
  }
}

function deserializeSimplifiedPair(serializedPair: SerializedPair): [Token, Token] {
  return [deserializeToken(serializedPair.token0), deserializeToken(serializedPair.token1)]
}

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useSelector<
    AppState,
    { userDarkMode: boolean | null; matchesDarkMode: boolean }
  >(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode
    }),
    shallowEqual
  )

  return userDarkMode === null ? matchesDarkMode : userDarkMode
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const darkMode = useIsDarkMode()

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }))
  }, [darkMode, dispatch])

  return [darkMode, toggleSetDarkMode]
}

export function useIsMultihop(): boolean {
  const { userMultihop } = useSelector<AppState, { userMultihop: boolean }>(
    ({ user: { userMultihop } }) => ({ userMultihop }),
    shallowEqual
  )

  return userMultihop
}

export function useMultihopManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userMultihop = useIsMultihop()

  const toggleMultihop = useCallback(() => {
    dispatch(updateUserMultihop({ userMultihop: !userMultihop }))
  }, [userMultihop, dispatch])

  return [userMultihop, toggleMultihop]
}

export function useIsExpertMode(): boolean {
  return useSelector<AppState, AppState['user']['userExpertMode']>(state => state.user.userExpertMode)
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const expertMode = useIsExpertMode()

  const toggleSetExpertMode = useCallback(() => {
    dispatch(updateUserExpertMode({ userExpertMode: !expertMode }))
  }, [expertMode, dispatch])

  return [expertMode, toggleSetExpertMode]
}

export function useUserSlippageTolerance(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userSlippageTolerance = useSelector<AppState, AppState['user']['userSlippageTolerance']>(state => {
    return state.user.userSlippageTolerance
  })

  const setUserSlippageTolerance = useCallback(
    (userSlippageTolerance: number) => {
      dispatch(updateUserSlippageTolerance({ userSlippageTolerance }))
    },
    [dispatch]
  )

  return [userSlippageTolerance, setUserSlippageTolerance]
}

export function useUserPreferredGasPrice(): [
  MainnetGasPrice | string | null,
  (preferredGasPrice: MainnetGasPrice | string | null) => void
] {
  const dispatch = useDispatch<AppDispatch>()
  const userPreferredGasPrice = useSelector<AppState, AppState['user']['userPreferredGasPrice']>(state => {
    return state.user.userPreferredGasPrice
  })

  const setUserPreferredGasPrice = useCallback(
    (userPreferredGasPrice: MainnetGasPrice | string | null) => {
      dispatch(updateUserPreferredGasPrice(userPreferredGasPrice))
    },
    [dispatch]
  )

  return [userPreferredGasPrice, setUserPreferredGasPrice]
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const dispatch = useDispatch<AppDispatch>()
  const userDeadline = useSelector<AppState, AppState['user']['userDeadline']>(state => {
    return state.user.userDeadline
  })

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch]
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch]
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch]
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap[chainId as ChainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializeSimplifiedPair(pair) }))
    },
    [dispatch]
  )
}

export function usePairRemover(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: Pair) => {
      dispatch(removeSerializedPair({ serializedPair: serializeSimplifiedPair(pair) }))
    },
    [dispatch]
  )
}

export function useUserAddedPairs(): Pair[] {
  const { chainId } = useActiveWeb3React()
  const serializedPairsMap = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)
  const simplifiedPairs = Object.values(serializedPairsMap[chainId as ChainId] ?? {}).map(deserializeSimplifiedPair)
  const pairs = usePairs(simplifiedPairs)

  return useMemo(() => {
    return pairs.reduce((userAddedPairs: Pair[], pair) => {
      if (pair[0] === PairState.EXISTS && pair[1] !== null) {
        userAddedPairs.push(pair[1])
      }
      return userAddedPairs
    }, [])
  }, [pairs])
}

export function useURLWarningVisible(): boolean {
  return useSelector((state: AppState) => state.user.URLWarningVisible)
}

export function useURLWarningToggle(): () => void {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleURLWarning()), [dispatch])
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toDXSwapLiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  return new Token(tokenA.chainId, Pair.getAddress(tokenA, tokenB), 18, 'DXD', 'DXswap')
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  // get user added tokens to be used as base
  const userAddedTokens = useUserAddedTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), tokenAddress => {
            const token = tokens[tokenAddress]
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId].concat(userAddedTokens) ?? [])
                // to construct pairs of the given token with each base
                .map(base => {
                  if (base.address === token.address) {
                    return null
                  } else {
                    return [base, token]
                  }
                })
                .filter((p): p is [Token, Token] => p !== null)
            )
          })
        : [],
    [tokens, userAddedTokens, chainId]
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(() => userPairs.concat(generatedPairs).concat(pinnedPairs), [
    generatedPairs,
    pinnedPairs,
    userPairs
  ])

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}

import { ChainId, JSBI, Pair, Token, TokenAmount } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { getTokenInfoWithFallback, isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import {
  addSerializedPair,
  addSerializedToken,
  dismissTokenWarning,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateUserDarkMode
} from './actions'
import { BASES_TO_TRACK_LIQUIDITY_FOR, DUMMY_PAIRS_TO_PIN } from '../../constants'

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

export function useFetchTokenByAddress(): (address: string) => Promise<Token | null> {
  const { library, chainId } = useActiveWeb3React()

  return useCallback(
    async (address: string): Promise<Token | null> => {
      if (!library || !chainId) return null
      const validatedAddress = isAddress(address)
      if (!validatedAddress) return null
      const { name, symbol, decimals } = await getTokenInfoWithFallback(validatedAddress, library)

      if (decimals === null) {
        return null
      } else {
        return new Token(chainId, validatedAddress, decimals, symbol, name)
      }
    },
    [library, chainId]
  )
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

const ZERO = JSBI.BigInt(0)

function serializePair(pair: Pair): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1)
  }
}

export function usePairAdder(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: Pair) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch]
  )
}

/**
 * Returns whether a token warning has been dismissed and a callback to dismiss it,
 * iff it has not already been dismissed and is a valid token.
 */
export function useTokenWarningDismissal(chainId?: number, token?: Token): [boolean, null | (() => void)] {
  const dismissalState = useSelector<AppState, AppState['user']['dismissedTokenWarnings']>(
    state => state.user.dismissedTokenWarnings
  )

  const dispatch = useDispatch<AppDispatch>()

  return useMemo(() => {
    if (!chainId || !token) return [false, null]

    const dismissed: boolean = dismissalState?.[chainId]?.[token.address] === true

    const callback = dismissed ? null : () => dispatch(dismissTokenWarning({ chainId, tokenAddress: token.address }))

    return [dismissed, callback]
  }, [chainId, token, dismissalState, dispatch])
}

export function useAllDummyPairs(): Pair[] {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => DUMMY_PAIRS_TO_PIN[chainId as ChainId] ?? [], [chainId])

  // pairs for every token against every base
  const generatedPairs: Pair[] = useMemo(
    () =>
      flatMap(
        Object.values(tokens)
          // select only tokens on the current chain
          .filter(token => token.chainId === chainId),
        token => {
          // for each token on the current chain,
          return (
            // loop though all bases on the current chain
            (BASES_TO_TRACK_LIQUIDITY_FOR[chainId as ChainId] ?? [])
              // to construct pairs of the given token with each base
              .map(base => {
                if (base.equals(token)) {
                  return null
                } else {
                  return new Pair(new TokenAmount(base, ZERO), new TokenAmount(token, ZERO))
                }
              })
              .filter(pair => !!pair) as Pair[]
          )
        }
      ),
    [tokens, chainId]
  )

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)
  const userPairs = useMemo(
    () =>
      Object.values<SerializedPair>(savedSerializedPairs[chainId ?? -1] ?? {}).map(
        pair =>
          new Pair(
            new TokenAmount(deserializeToken(pair.token0), ZERO),
            new TokenAmount(deserializeToken(pair.token1), ZERO)
          )
      ),
    [savedSerializedPairs, chainId]
  )

  return useMemo(() => {
    const cache: { [pairKey: string]: boolean } = {}
    return (
      pinnedPairs
        .concat(generatedPairs)
        .concat(userPairs)
        // filter out duplicate pairs
        .filter(pair => {
          const pairKey = `${pair.token0.address}:${pair.token1.address}`
          if (cache[pairKey]) {
            return false
          }
          return (cache[pairKey] = true)
        })
    )
  }, [pinnedPairs, generatedPairs, userPairs])
}

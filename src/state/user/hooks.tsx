import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from '../../constants/routing'
import { Pair, computePairAddress } from '@uniswap/v2-sdk'
import { Percent, Token } from '@uniswap/sdk-core'
import { SearchPreferenceState, TokenFavorite } from './reducer'
import {
  SerializedPair,
  SerializedToken,
  addSerializedPair,
  addSerializedToken,
  removeSerializedToken,
  updateArbitrumAlphaAcknowledged,
  updateFavoritedTokens,
  updateHideClosedPositions,
  updateUseAutoSlippage,
  updateUserChartHistory,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserDetectRenouncedOwnership,
  updateUserExpertMode,
  updateUserFrontRunProtection,
  updateUserGasPreferences,
  updateUserLocale,
  updateUserSearchPreferences,
  updateUserSingleHopOnly,
  updateUserSlippageTolerance,
} from './actions'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useCallback, useMemo } from 'react'

import { AppState } from '../index'
import JSBI from 'jsbi'
import { L2_CHAIN_IDS } from 'constants/chains'
import { L2_DEADLINE_FROM_NOW } from 'constants/misc'
import { SupportedLocale } from 'constants/locales'
import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import _ from 'lodash'
import flatMap from 'lodash.flatmap'
import { shallowEqual } from 'react-redux'
import { useActiveWeb3React } from '../../hooks/web3'
import { useAllTokens } from '../../hooks/Tokens'

function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
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
  const { userDarkMode, matchesDarkMode } = useAppSelector(
    ({ user: { matchesDarkMode, userDarkMode } }) => ({
      userDarkMode,
      matchesDarkMode,
    }),
    shallowEqual
  )

 return useAppSelector((state ) => state.user.userDarkMode || false)
}

export function useDarkModeManager(): [boolean, () => void] {
  const dispatch = useAppDispatch()
  const darkMode = useIsDarkMode()

  const toggleSetDarkMode = useCallback(() => {
    dispatch(updateUserDarkMode({ userDarkMode: !darkMode }))
  }, [darkMode, dispatch])

  return [darkMode, toggleSetDarkMode]
}

export function useUserFavoritesManager(): [TokenFavorite[], (favorites: TokenFavorite[]) => void] {
  const dispatch = useAppDispatch()
  const favorites = useAppSelector((state) => state.user.favorites)

  const updateUserFavorites = useCallback((_favorites: TokenFavorite[]) => {
    dispatch(updateFavoritedTokens({newFavorites: _favorites}))
  }, [favorites, dispatch])

  return [favorites, updateUserFavorites]
}

export function useAddPairToFavorites () {
  const [current,updateFavorites] = useUserFavoritesManager()

  const addToFavorites = useCallback((pairAddress: string, network: string, tokenAddress: string, tokenName: string, tokenSymbol: string) => {
    const updated = _.uniqBy([...(current || []), {pairAddress, network, tokenName, tokenSymbol, tokenAddress}], pair => pair.pairAddress)

    updateFavorites(updated)
  }, [current, updateFavorites])


  const removeFromFavorites = useCallback((pairAddress:string) => {
    const updated = [...(current || []).filter(pair => pair.pairAddress !== pairAddress)]
    updateFavorites(updated)
  }, [ current, updateFavorites ])

  return {
    addToFavorites,
    removeFromFavorites
  }
}

export function useIsPairFavorited (pairAddress: string) {
  const [favorites,] = useUserFavoritesManager()

  return useMemo(() => {
    return favorites?.some((favorite) => favorite?.pairAddress?.toLowerCase() == pairAddress?.toLowerCase())
  }, [favorites])
}

export function useUserLocale(): SupportedLocale | null {
  return useAppSelector((state) => state.user.userLocale)
}

export function useUserSearchPrefManager(): [SearchPreferenceState, (newState: SearchPreferenceState) => void] {
  const dispatch = useAppDispatch()
  const prefs = useAppSelector((state ) => state.user.searchPreferences || [])

  const updatePrefs = useCallback((newPrefs: SearchPreferenceState) => {
    dispatch(updateUserSearchPreferences({ newPreferences: newPrefs }))
  }, [prefs, dispatch])

  return [prefs, updatePrefs]
}

export function useUserChartHistoryManager(): [any[], (payload: any[]) => void] {
  const dispatch = useAppDispatch()
  const history = useAppSelector((state ) => state.user.chartHistory || [])

  const updateHistory = useCallback((updatedHistory: any[]) => {
    dispatch(updateUserChartHistory({ chartHistory: updatedHistory }))
  }, [history, dispatch])

  return [history, updateHistory]
}


export function useUserLocaleManager(): [SupportedLocale | null, (newLocale: SupportedLocale) => void] {
  const dispatch = useAppDispatch()
  const locale = useUserLocale()

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      dispatch(updateUserLocale({ userLocale: newLocale }))
    },
    [dispatch]
  )

  return [locale, setLocale]
}

export function useIsExpertMode(): boolean {
  return useAppSelector((state) => state.user.userExpertMode)
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useAppDispatch()
  const expertMode = useIsExpertMode()

  const toggleSetExpertMode = useCallback(() => {
    dispatch(updateUserExpertMode({ userExpertMode: !expertMode }))
  }, [expertMode, dispatch])

  return [expertMode, toggleSetExpertMode]
}

export function useUserDetectRenounced(): [boolean, (newDetectRenounced: boolean) => void] {
  const dispatch = useAppDispatch()

  const singleHopOnly = useAppSelector((state) => state.user.detectRenouncedOwnership)

  const setSingleHopOnly = useCallback(
    (useUserDetectRenounced: boolean) => {
      dispatch(updateUserDetectRenouncedOwnership({ detectRenouncedOwnership: useUserDetectRenounced }))
    },
    [dispatch]
  )

  return [singleHopOnly, setSingleHopOnly]
}


export function useUserSingleHopOnly(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useAppDispatch()

  const singleHopOnly = useAppSelector((state) => state.user.userSingleHopOnly)

  const setSingleHopOnly = useCallback(
    (newSingleHopOnly: boolean) => {
      dispatch(updateUserSingleHopOnly({ userSingleHopOnly: newSingleHopOnly }))
    },
    [dispatch]
  )

  return [singleHopOnly, setSingleHopOnly]
}


export function useSetFrontrunProtectionEnabled(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useAppDispatch()

  const useFrontrunProtection = useAppSelector((state) => state.user.useFrontrunProtection)

  const setUseFrontrunProtection = useCallback(
    (useFrontrunProtection: boolean) => {
      dispatch(updateUserFrontRunProtection({ useFrontrunProtection }))
    },
    [dispatch]
  )

  return [useFrontrunProtection, setUseFrontrunProtection]
}

export function useSetAutoSlippage(): [boolean, (newSingleHopOnly: boolean) => void] {
  const dispatch = useAppDispatch()

  const useAutoSlippage = useAppSelector((state) => state.user.useAutoSlippage)

  const setUseAutoSlippage = useCallback(
    (useAutoSlippage: boolean) => {
      dispatch(updateUseAutoSlippage({ useAutoSlippage }))
    },
    [dispatch]
  )

  return [useAutoSlippage, setUseAutoSlippage]
}

export function useSetUserSlippageTolerance(): (slippageTolerance: Percent | 'auto') => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (userSlippageTolerance: Percent | 'auto') => {
      let value: 'auto' | number
      try {
        value =
          userSlippageTolerance === 'auto' ? 'auto' : JSBI.toNumber(userSlippageTolerance.multiply(10_000).quotient)
      } catch (error) {
        value = 'auto'
      }
      dispatch(
        updateUserSlippageTolerance({
          userSlippageTolerance: value,
        })
      )
    },
    [dispatch]
  )
}


export function useSetUserGasPreference(): (gasSettings: any) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (userGasSettings: any) => {
      dispatch(
        updateUserGasPreferences({
          ...userGasSettings
        })
      )
    },
    [dispatch]
  )
}

/**
 * Return the user's slippage tolerance, from the redux store, and a function to update the slippage tolerance
 */
export function useUserSlippageTolerance(): Percent | 'auto' {
  const userSlippageTolerance = useAppSelector((state) => {
    return state.user.userSlippageTolerance
  })

  return useMemo(
    () => (userSlippageTolerance === 'auto' ? 'auto' : new Percent(userSlippageTolerance, 10_000)),
    [userSlippageTolerance]
  )
}

export function useUserGasPreference(): { ultra?:boolean, low?: boolean, medium?:boolean, high?:boolean, custom?: 0, useOnce?: boolean } {

  const userGasSelection = useAppSelector((state) => {
    return state.user.preferredGas
  })

  return useMemo(
    () => userGasSelection,
    [userGasSelection]
  )
}

export function useUserHideClosedPositions(): [boolean, (newHideClosedPositions: boolean) => void] {
  const dispatch = useAppDispatch()

  const hideClosedPositions = useAppSelector((state) => state.user.userHideClosedPositions)

  const setHideClosedPositions = useCallback(
    (newHideClosedPositions: boolean) => {
      dispatch(updateHideClosedPositions({ userHideClosedPositions: newHideClosedPositions }))
    },
    [dispatch]
  )

  return [hideClosedPositions, setHideClosedPositions]
}

/**
 * Same as above but replaces the auto with a default value
 * @param defaultSlippageTolerance the default value to replace auto with
 */
export function useUserSlippageToleranceWithDefault(defaultSlippageTolerance: Percent): Percent {
  const allowedSlippage = useUserSlippageTolerance()
  return useMemo(
    () => (allowedSlippage === 'auto' ? defaultSlippageTolerance : allowedSlippage),
    [allowedSlippage, defaultSlippageTolerance]
  )
}

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const userDeadline = useAppSelector((state) => state.user.userDeadline)
  const onL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))
  const deadline = onL2 ? L2_DEADLINE_FROM_NOW : userDeadline

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch]
  )

  return [deadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch]
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch]
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useAppSelector(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap?.[chainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
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
    [dispatch]
  )
}

export function useURLWarningVisible(): boolean {
  return useAppSelector((state: AppState) => state.user.URLWarningVisible)
}

/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export function toV2LiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  if (tokenA.chainId !== tokenB.chainId) throw new Error('Not matching chain IDs')
  if (tokenA.equals(tokenB)) throw new Error('Tokens cannot be equal')
  if (!V2_FACTORY_ADDRESSES[tokenA.chainId]) throw new Error('No V2 factory address on this chain')

  return new Token(
    tokenA.chainId,
    computePairAddress({ factoryAddress: V2_FACTORY_ADDRESSES[tokenA.chainId], tokenA, tokenB }),
    18,
    'UNI-V2',
    'Uniswap V2'
  )
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // pairs for every token against every base
  const generatedPairs: [Token, Token][] = useMemo(
    () =>
      chainId
        ? flatMap(Object.keys(tokens), (tokenAddress) => {
            const token = tokens[tokenAddress]
            // for each token on the current chain,
            return (
              // loop though all bases on the current chain
              (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
                // to construct pairs of the given token with each base
                .map((base) => {
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
    [tokens, chainId]
  )

  // pairs saved by users
  const savedSerializedPairs = useAppSelector(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!chainId || !savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map((pairId) => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(
    () => userPairs.concat(generatedPairs).concat(pinnedPairs),
    [generatedPairs, pinnedPairs, userPairs]
  )

  return useMemo(() => {
    // dedupes pairs of tokens in the combined list
    const keyed = combinedList.reduce<{ [key: string]: [Token, Token] }>((memo, [tokenA, tokenB]) => {
      const sorted = tokenA.sortsBefore(tokenB)
      const key = sorted ? `${tokenA.address}:${tokenB.address}` : `${tokenB.address}:${tokenA.address}`
      if (memo[key]) return memo
      memo[key] = sorted ? [tokenA, tokenB] : [tokenB, tokenA]
      return memo
    }, {})

    return Object.keys(keyed).map((key) => keyed[key])
  }, [combinedList])
}

export function useArbitrumAlphaAlert(): [boolean, (arbitrumAlphaAcknowledged: boolean) => void] {
  const dispatch = useAppDispatch()
  const arbitrumAlphaAcknowledged = useAppSelector(({ user }) => user.arbitrumAlphaAcknowledged)
  const setArbitrumAlphaAcknowledged = (arbitrumAlphaAcknowledged: boolean) => {
    dispatch(updateArbitrumAlphaAcknowledged({ arbitrumAlphaAcknowledged }))
  }

  return [arbitrumAlphaAcknowledged, setArbitrumAlphaAcknowledged]
}

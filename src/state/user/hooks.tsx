import { useFactoryContract } from 'hooks/useContract'
import { ChainId, Pair, Token } from '@dynamic-amm/sdk'
import { Pair as PairUNI, Token as TokenUNI, ChainId as ChainIdUNI } from '@uniswap/sdk'
import { Pair as PairSUSHI, Token as TokenSUSHI } from '@sushiswap/sdk'
import flatMap from 'lodash.flatmap'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { BASES_TO_TRACK_LIQUIDITY_FOR, PINNED_PAIRS } from '../../constants'
import { SupportedLocale } from 'constants/locales'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
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
  updateUserLocale,
  toggleRebrandingAnnouncement,
  toggleLiveChart,
  toggleTradeRoutes
} from './actions'
import { convertChainIdFromDmmToSushi } from 'utils/dmm'
import { useUserLiquidityPositions } from 'state/pools/hooks'
import { useAllTokens } from 'hooks/Tokens'
import { isAddress } from 'utils'
import { useAppSelector } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

function serializeToken(token: Token | TokenUNI | TokenSUSHI | WrappedTokenInfo): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    list: token instanceof WrappedTokenInfo ? token.list : undefined,
    logoURI: token instanceof WrappedTokenInfo ? token.tokenInfo.logoURI : undefined
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return serializedToken?.logoURI && serializedToken?.list
    ? new WrappedTokenInfo(
        {
          chainId: serializedToken.chainId,
          address: serializedToken.address,
          name: serializedToken.name ?? '',
          symbol: serializedToken.symbol ?? '',
          decimals: serializedToken.decimals,
          logoURI: serializedToken.logoURI
        },
        serializedToken.list
      )
    : new Token(
        serializedToken.chainId,
        serializedToken.address,
        serializedToken.decimals,
        serializedToken.symbol,
        serializedToken.name
      )
}
// function deserializeTokenUNI(serializedToken: SerializedToken): TokenUNI {
//   return new TokenUNI(
//     serializedToken.chainId,
//     serializedToken.address,
//     serializedToken.decimals,
//     serializedToken.symbol,
//     serializedToken.name
//   )
// }

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

export function useUserLocale(): SupportedLocale | null {
  return useAppSelector(state => state.user.userLocale)
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

function serializePair(pair: Pair | PairUNI | PairSUSHI): SerializedPair {
  return {
    token0: serializeToken(pair.token0),
    token1: serializeToken(pair.token1)
  }
}

export function usePairAdder(): (pair: PairUNI | PairSUSHI) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (pair: PairUNI | PairSUSHI) => {
      dispatch(addSerializedPair({ serializedPair: serializePair(pair) }))
    },
    [dispatch]
  )
}

export function usePairAdderByTokens(): (token0: Token, token1: Token) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (token0: Token, token1: Token) => {
      dispatch(
        addSerializedPair({
          serializedPair: {
            token0: serializeToken(token0),
            token1: serializeToken(token1)
          }
        })
      )
    },
    [dispatch]
  )
}

export function useRebrandingAnnouncement(): boolean {
  const rebrandingAnnouncement = useSelector((state: AppState) => state.user.rebrandingAnnouncement)
  return rebrandingAnnouncement === undefined || rebrandingAnnouncement
}

export function useToggleRebrandingAnnouncement(): () => void {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleRebrandingAnnouncement()), [dispatch])
}

export function useURLWarningVisible(): boolean {
  const rebrandingAnnouncement = useRebrandingAnnouncement()
  const urlWarningVisible = useSelector((state: AppState) => state.user.URLWarningVisible)

  return !rebrandingAnnouncement && urlWarningVisible
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

export function toV2LiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  return new Token(
    tokenA.chainId,
    PairUNI.getAddress(
      new TokenUNI(tokenA.chainId as ChainIdUNI, tokenA.address, tokenA.decimals, tokenA.symbol, tokenA.name),
      new TokenUNI(tokenB.chainId as ChainIdUNI, tokenB.address, tokenB.decimals, tokenB.symbol, tokenB.name)
    ),
    18,
    'UNI-LP',
    'UNI LP'
  )
}

export function toV2LiquidityTokenSushi([tokenA, tokenB]: [Token, Token]): Token {
  return new Token(
    tokenA.chainId,
    PairSUSHI.getAddress(
      new TokenSUSHI(
        convertChainIdFromDmmToSushi(tokenA.chainId),
        tokenA.address,
        tokenA.decimals,
        tokenA.symbol,
        tokenA.name
      ),
      new TokenSUSHI(
        convertChainIdFromDmmToSushi(tokenB.chainId),
        tokenB.address,
        tokenB.decimals,
        tokenB.symbol,
        tokenB.name
      )
    ),
    18,
    'SUSHI-LP',
    'SUSHI LP'
  )
}

export function useToV2LiquidityTokens(
  tokenCouples: [Token, Token][]
): { liquidityTokens: []; tokens: [Token, Token] }[] {
  const contract = useFactoryContract()
  const result = useSingleContractMultipleData(
    contract,
    'getPools',
    tokenCouples.map(([tokenA, tokenB]) => [tokenA.address, tokenB.address])
  )
  return result.map((result, index) => ({
    tokens: tokenCouples[index],
    liquidityTokens:
      result.result?.[0].map(
        (address: string) => new Token(tokenCouples[index][0].chainId, address, 18, 'DMM-LP', 'DMM LP')
      ) || []
  }))
}

/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export function useTrackedTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  // get tracked pairs
  const generatedPairs: [Token, Token][] = useMemo(() => {
    if (chainId) {
      const baseTrackedTokens = BASES_TO_TRACK_LIQUIDITY_FOR[chainId]

      return flatMap(baseTrackedTokens, trackedToken => {
        return (
          // loop though all bases on the current chain
          (BASES_TO_TRACK_LIQUIDITY_FOR[chainId] ?? [])
            // to construct pairs of the given token with each base
            .map(base => {
              if (base.address === trackedToken.address) {
                return null
              } else {
                return [base, trackedToken]
              }
            })
            .filter((p): p is [Token, Token] => p !== null)
        )
      })
    }

    return []
  }, [chainId])

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

export function useLiquidityPositionTokenPairs(): [Token, Token][] {
  const { chainId, account } = useActiveWeb3React()
  const allTokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  const { data: userLiquidityPositions } = useUserLiquidityPositions(account)

  // get pairs that has liquidity
  const generatedPairs: [Token, Token][] = useMemo(() => {
    if (userLiquidityPositions?.liquidityPositions) {
      const result: [Token, Token][] = []

      userLiquidityPositions?.liquidityPositions.forEach(position => {
        const token0Address = isAddress(position.pool.token0.id)
        const token1Address = isAddress(position.pool.token1.id)

        if (token0Address && token1Address && allTokens[token0Address] && allTokens[token1Address]) {
          result.push([allTokens[token0Address], allTokens[token1Address]])
        }
      })

      return result
    }

    return []
  }, [allTokens, userLiquidityPositions])

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

export function useShowLiveChart(): boolean {
  const showLiveChart = useSelector((state: AppState) => state.user.showLiveChart)
  return showLiveChart
}
export function useShowTradeRoutes(): boolean {
  const showTradeRoutes = useSelector((state: AppState) => state.user.showTradeRoutes)
  return showTradeRoutes
}
export function useToggleLiveChart(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleLiveChart()), [dispatch])
}
export function useToggleTradeRoutes(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTradeRoutes()), [dispatch])
}

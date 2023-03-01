import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { TERM_FILES_PATH } from 'constants/index'
import { SupportedLocale } from 'constants/locales'
import { PINNED_PAIRS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import {
  useDynamicFeeFactoryContract,
  useOldStaticFeeFactoryContract,
  useStaticFeeFactoryContract,
} from 'hooks/useContract'
import { AppDispatch, AppState } from 'state'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useSingleContractMultipleData } from 'state/multicall/hooks'
import { useUserLiquidityPositions } from 'state/pools/hooks'
import {
  SerializedToken,
  ToggleFavoriteTokenPayload,
  addSerializedPair,
  addSerializedToken,
  changeViewMode,
  removeSerializedToken,
  toggleFavoriteToken as toggleFavoriteTokenAction,
  toggleHolidayMode,
  toggleLiveChart,
  toggleTokenInfo,
  toggleTopTrendingTokens,
  toggleTradeRoutes,
  updateAcceptedTermVersion,
  updateIsUserManuallyDisconnect,
  updateUserDarkMode,
  updateUserDeadline,
  updateUserExpertMode,
  updateUserLocale,
  updateUserSlippageTolerance,
} from 'state/user/actions'
import { VIEW_MODE, defaultShowLiveCharts, getFavoriteTokenDefault } from 'state/user/reducer'
import { isAddress, isChristmasTime } from 'utils'

function serializeToken(token: Token | WrappedTokenInfo): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
    logoURI: token instanceof WrappedTokenInfo ? token.logoURI : undefined,
  }
}

function deserializeToken(serializedToken: SerializedToken): Token {
  return serializedToken?.logoURI
    ? new WrappedTokenInfo({
        chainId: serializedToken.chainId,
        address: serializedToken.address,
        name: serializedToken.name ?? '',
        symbol: serializedToken.symbol ?? '',
        decimals: serializedToken.decimals,
        logoURI: serializedToken.logoURI,
      })
    : new Token(
        serializedToken.chainId,
        serializedToken.address,
        serializedToken.decimals,
        serializedToken.symbol,
        serializedToken.name,
      )
}

export function useIsDarkMode(): boolean {
  const userDarkMode = useSelector<AppState, boolean | null>(state => state.user.userDarkMode)
  const matchesDarkMode = useSelector<AppState, boolean>(state => state.user.matchesDarkMode)

  return typeof userDarkMode !== 'boolean' ? matchesDarkMode : userDarkMode
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
    [dispatch],
  )

  return [locale, setLocale]
}

export function useIsUserManuallyDisconnect(): [boolean, (isUserManuallyDisconnect: boolean) => void] {
  const dispatch = useAppDispatch()
  const isUserManuallyDisconnect = useSelector<AppState, AppState['user']['isUserManuallyDisconnect']>(
    state => state.user.isUserManuallyDisconnect,
  )

  const setIsUserManuallyDisconnect = useCallback(
    (isUserManuallyDisconnect: boolean) => {
      dispatch(updateIsUserManuallyDisconnect(isUserManuallyDisconnect))
    },
    [dispatch],
  )

  return [isUserManuallyDisconnect, setIsUserManuallyDisconnect]
}

export function useIsAcceptedTerm(): [boolean, (isAcceptedTerm: boolean) => void] {
  const dispatch = useAppDispatch()
  const acceptedTermVersion = useSelector<AppState, AppState['user']['acceptedTermVersion']>(
    state => state.user.acceptedTermVersion,
  )

  const isAcceptedTerm = !!acceptedTermVersion && acceptedTermVersion === TERM_FILES_PATH.VERSION

  const setIsAcceptedTerm = useCallback(
    (isAcceptedTerm: boolean) => {
      dispatch(updateAcceptedTermVersion(isAcceptedTerm ? TERM_FILES_PATH.VERSION : null))
    },
    [dispatch],
  )

  return [isAcceptedTerm, setIsAcceptedTerm]
}

export function useExpertModeManager(): [boolean, () => void] {
  const dispatch = useDispatch<AppDispatch>()
  const expertMode = useSelector<AppState, AppState['user']['userExpertMode']>(state => state.user.userExpertMode)

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
    [dispatch],
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
    [dispatch],
  )

  return [userDeadline, setUserDeadline]
}

export function useAddUserToken(): (token: Token) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (token: Token) => {
      dispatch(addSerializedToken({ serializedToken: serializeToken(token) }))
    },
    [dispatch],
  )
}

export function useRemoveUserAddedToken(): (chainId: number, address: string) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (chainId: number, address: string) => {
      dispatch(removeSerializedToken({ chainId, address }))
    },
    [dispatch],
  )
}

export function useUserAddedTokens(): Token[] {
  const { chainId } = useActiveWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap[chainId] ?? {})
      .map(deserializeToken)
      .filter(e => !(!e.symbol && !e.decimals && !e.name))
  }, [serializedTokensMap, chainId])
}

export function usePairAdderByTokens(): (token0: Token, token1: Token) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (token0: Token, token1: Token) => {
      dispatch(
        addSerializedPair({
          serializedPair: {
            token0: serializeToken(token0),
            token1: serializeToken(token1),
          },
        }),
      )
    },
    [dispatch],
  )
}

export function useToV2LiquidityTokens(
  tokenCouples: [Token, Token][],
): { liquidityTokens: []; tokens: [Token, Token] }[] {
  const oldStaticContract = useOldStaticFeeFactoryContract()
  const staticContract = useStaticFeeFactoryContract()
  const dynamicContract = useDynamicFeeFactoryContract()

  const addresses = useMemo(
    () => tokenCouples.map(([tokenA, tokenB]) => [tokenA.address, tokenB.address]),
    [tokenCouples],
  )

  const result1 = useSingleContractMultipleData(staticContract, 'getPools', addresses)
  const result2 = useSingleContractMultipleData(dynamicContract, 'getPools', addresses)
  const result3 = useSingleContractMultipleData(oldStaticContract, 'getPools', addresses)
  const result = useMemo(
    () =>
      result1?.map((call, index) => {
        return {
          ...call,
          result: [
            call.result?.[0].concat(result2?.[index]?.result?.[0] || []).concat(result3?.[index]?.result?.[0] || []),
          ],
        }
      }),
    [result1, result2, result3],
  )
  return useMemo(
    () =>
      result.map((result, index) => {
        return {
          tokens: tokenCouples[index],
          liquidityTokens: result?.result?.[0]
            ? result.result[0].map(
                (address: string) => new Token(tokenCouples[index][0].chainId, address, 18, 'DMM-LP', 'DMM LP'),
              )
            : [],
        }
      }),
    [tokenCouples, result],
  )
}

export function useLiquidityPositionTokenPairs(): [Token, Token][] {
  const { chainId } = useActiveWeb3React()
  const allTokens = useAllTokens()

  // pinned pairs
  const pinnedPairs = useMemo(() => (chainId ? PINNED_PAIRS[chainId] ?? [] : []), [chainId])

  const { data: userLiquidityPositions } = useUserLiquidityPositions()

  // get pairs that has liquidity
  const generatedPairs: [Token, Token][] = useMemo(() => {
    if (userLiquidityPositions?.liquidityPositions) {
      const result: [Token, Token][] = []

      userLiquidityPositions?.liquidityPositions.forEach(position => {
        const token0Address = isAddress(chainId, position.pool.token0.id)
        const token1Address = isAddress(chainId, position.pool.token1.id)

        if (token0Address && token1Address && allTokens[token0Address] && allTokens[token1Address]) {
          result.push([allTokens[token0Address], allTokens[token1Address]])
        }
      })

      return result
    }

    return []
  }, [chainId, allTokens, userLiquidityPositions])

  // pairs saved by users
  const savedSerializedPairs = useSelector<AppState, AppState['user']['pairs']>(({ user: { pairs } }) => pairs)

  const userPairs: [Token, Token][] = useMemo(() => {
    if (!savedSerializedPairs) return []
    const forChain = savedSerializedPairs[chainId]
    if (!forChain) return []

    return Object.keys(forChain).map(pairId => {
      return [deserializeToken(forChain[pairId].token0), deserializeToken(forChain[pairId].token1)]
    })
  }, [savedSerializedPairs, chainId])

  const combinedList = useMemo(
    () => userPairs.concat(generatedPairs).concat(pinnedPairs),
    [generatedPairs, pinnedPairs, userPairs],
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

    return Object.keys(keyed).map(key => keyed[key])
  }, [combinedList])
}

export function useShowLiveChart(): boolean {
  const { chainId } = useActiveWeb3React()
  let showLiveChart = useSelector((state: AppState) => state.user.showLiveCharts)
  if (typeof showLiveChart?.[chainId] !== 'boolean') {
    showLiveChart = defaultShowLiveCharts
  }

  const show = showLiveChart[chainId]

  return !!show
}

export function useShowTradeRoutes(): boolean {
  const showTradeRoutes = useSelector((state: AppState) => state.user.showTradeRoutes)
  return showTradeRoutes
}

export function useShowTokenInfo(): boolean {
  return useSelector((state: AppState) => state.user.showTokenInfo) ?? true
}

export function useShowTopTrendingSoonTokens(): boolean {
  const showTrendingSoon = useSelector((state: AppState) => state.user.showTopTrendingSoonTokens)
  return showTrendingSoon ?? true
}

export function useToggleLiveChart(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  const { chainId } = useActiveWeb3React()
  return useCallback(() => dispatch(toggleLiveChart({ chainId: chainId })), [dispatch, chainId])
}

export function useToggleTradeRoutes(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTradeRoutes()), [dispatch])
}

export function useToggleTokenInfo(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTokenInfo()), [dispatch])
}

export function useToggleTopTrendingTokens(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(toggleTopTrendingTokens()), [dispatch])
}

export const useUserFavoriteTokens = (chainId: ChainId) => {
  const dispatch = useDispatch<AppDispatch>()
  const { favoriteTokensByChainId } = useSelector((state: AppState) => state.user)

  const favoriteTokens = useMemo(() => {
    if (!chainId) return undefined
    return favoriteTokensByChainId
      ? favoriteTokensByChainId[chainId] || getFavoriteTokenDefault(chainId)
      : getFavoriteTokenDefault(chainId)
  }, [chainId, favoriteTokensByChainId])

  const toggleFavoriteToken = useCallback(
    (payload: ToggleFavoriteTokenPayload) => dispatch(toggleFavoriteTokenAction(payload)),
    [dispatch],
  )

  return { favoriteTokens, toggleFavoriteToken }
}

export const useViewMode: () => [VIEW_MODE, (mode: VIEW_MODE) => void] = () => {
  const dispatch = useAppDispatch()
  const viewMode = useAppSelector(state => state.user.viewMode || VIEW_MODE.GRID)

  const setViewMode = useCallback((mode: VIEW_MODE) => dispatch(changeViewMode(mode)), [dispatch])

  return [viewMode, setViewMode]
}

export const useHolidayMode: () => [boolean, () => void] = () => {
  const dispatch = useAppDispatch()
  const holidayMode = useAppSelector(state => (state.user.holidayMode === undefined ? true : state.user.holidayMode))

  const toggle = useCallback(() => {
    dispatch(toggleHolidayMode())
  }, [dispatch])

  return [isChristmasTime() ? holidayMode : false, toggle]
}

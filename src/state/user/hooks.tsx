import { ChainId, JSBI, Pair, Token, TokenAmount, WETH } from '@uniswap/sdk'
import { useWeb3React } from '../../hooks'
import { useCallback, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useAllTokens } from '../../hooks/Tokens'
import { getTokenDecimals, getTokenName, getTokenSymbol } from '../../utils'
import { AppDispatch, AppState } from '../index'
import {
  addSerializedPair,
  addSerializedToken,
  dismissBetaMessage,
  removeSerializedToken,
  SerializedPair,
  SerializedToken,
  updateUserDarkMode
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

// this currently isn't used anywhere, but is kept as an example of how to store/update a simple boolean
export function useBetaMessageManager() {
  const betaMessageDismissed = useSelector<AppState, boolean>(state => state.user.betaMessageDismissed)
  const dispatch = useDispatch<AppDispatch>()

  const wrappedDismissBetaMessage = useCallback(() => {
    dispatch(dismissBetaMessage())
  }, [dispatch])

  return [!betaMessageDismissed, wrappedDismissBetaMessage]
}

export function useIsDarkMode(): boolean {
  const { userDarkMode, matchesDarkMode } = useSelector<AppState, { userDarkMode: boolean; matchesDarkMode: boolean }>(
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
  const { library, chainId } = useWeb3React()

  return useCallback(
    async (address: string) => {
      const [decimals, symbol, name] = await Promise.all([
        getTokenDecimals(address, library).catch(() => null),
        getTokenSymbol(address, library).catch(() => 'UNKNOWN'),
        getTokenName(address, library).catch(() => 'Unknown')
      ])

      if (decimals === null) {
        return null
      } else {
        return new Token(chainId, address, decimals, symbol, name)
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
  const { chainId } = useWeb3React()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    return Object.values(serializedTokensMap[chainId] ?? {}).map(deserializeToken)
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

const bases = [
  ...Object.values(WETH),
  new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
]

export function useAllDummyPairs(): Pair[] {
  const { chainId } = useWeb3React()
  const tokens = useAllTokens()

  const generatedPairs: Pair[] = useMemo(
    () =>
      Object.values(tokens)
        // select only tokens on the current chain
        .filter(token => token.chainId === chainId)
        .flatMap(token => {
          // for each token on the current chain,
          return (
            bases
              // loop through all the bases valid for the current chain,
              .filter(base => base.chainId === chainId)
              // to construct pairs of the given token with each base
              .map(base => {
                if (base.equals(token)) {
                  return null
                } else {
                  return new Pair(new TokenAmount(base, ZERO), new TokenAmount(token, ZERO))
                }
              })
              .filter(pair => !!pair)
          )
        }),
    [tokens, chainId]
  )

  const savedSerializedPairs = useSelector<AppState>(({ user: { pairs } }) => pairs)

  const userPairs = useMemo(
    () =>
      Object.values<SerializedPair>(savedSerializedPairs[chainId] ?? {}).map(
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
      generatedPairs
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
  }, [generatedPairs, userPairs])
}

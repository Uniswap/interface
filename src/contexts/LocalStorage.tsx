import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react'
import { Token, Pair, TokenAmount, JSBI, WETH, ChainId } from '@uniswap/sdk'
import { getTokenDecimals, getTokenSymbol, getTokenName, isAddress } from '../utils'
import { useWeb3React } from '@web3-react/core'
import { useAllTokens } from './Tokens'

enum LocalStorageKeys {
  VERSION = 'version',
  LAST_SAVED = 'lastSaved',
  BETA_MESSAGE_DISMISSED = 'betaMessageDismissed',
  MIGRATION_MESSAGE_DISMISSED = 'migrationMessageDismissed',
  DARK_MODE = 'darkMode',
  TOKENS = 'tokens',
  PAIRS = 'pairs'
}

function useLocalStorage<T, S = T>(
  key: LocalStorageKeys,
  defaultValue: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { serialize, deserialize }: { serialize: (toSerialize: T) => S; deserialize: (toDeserialize: S) => T } = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serialize: (toSerialize): S => (toSerialize as unknown) as S,
    deserialize: (toDeserialize): T => (toDeserialize as unknown) as T
  }
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => {
    try {
      return deserialize(JSON.parse(window.localStorage.getItem(key))) ?? defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(serialize(value)))
    } catch {}
  }, [key, serialize, value])

  return [value, setValue]
}

interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol: string
  name: string
}

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

const LocalStorageContext = createContext<[any, any]>([{}, {}])

function useLocalStorageContext() {
  return useContext(LocalStorageContext)
}

export default function Provider({ children }: { children: React.ReactNode }) {
  // global localstorage state
  const [version, setVersion] = useLocalStorage<number>(LocalStorageKeys.VERSION, 0)
  const [lastSaved, setLastSaved] = useLocalStorage<number>(LocalStorageKeys.LAST_SAVED, Math.floor(Date.now() / 1000))
  const [betaMessageDismissed, setBetaMessageDismissed] = useLocalStorage<boolean>(
    LocalStorageKeys.BETA_MESSAGE_DISMISSED,
    false
  )
  const [migrationMessageDismissed, setMigrationMessageDismissed] = useLocalStorage<boolean>(
    LocalStorageKeys.MIGRATION_MESSAGE_DISMISSED,
    false
  )
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(
    LocalStorageKeys.DARK_MODE,
    window?.matchMedia('(prefers-color-scheme: dark)')?.matches ? true : false
  )
  const [tokens, setTokens] = useLocalStorage<Token[], SerializedToken[]>(LocalStorageKeys.TOKENS, [], {
    serialize: (tokens: Token[]) => tokens.map(serializeToken),
    deserialize: (serializedTokens: SerializedToken[]) => serializedTokens.map(deserializeToken)
  })
  const [pairs, setPairs] = useLocalStorage<Token[][], SerializedToken[][]>(LocalStorageKeys.PAIRS, [], {
    serialize: (nestedTokens: Token[][]) => nestedTokens.map(tokens => tokens.map(serializeToken)),
    deserialize: (serializedNestedTokens: SerializedToken[][]) =>
      serializedNestedTokens.map(serializedTokens => serializedTokens.map(deserializeToken))
  })

  return (
    <LocalStorageContext.Provider
      value={useMemo(
        () => [
          { version, lastSaved, betaMessageDismissed, migrationMessageDismissed, darkMode, tokens, pairs },
          {
            setVersion,
            setLastSaved,
            setBetaMessageDismissed,
            setMigrationMessageDismissed,
            setDarkMode,
            setTokens,
            setPairs
          }
        ],
        [
          version,
          lastSaved,
          betaMessageDismissed,
          migrationMessageDismissed,
          darkMode,

          tokens,
          pairs,
          setVersion,
          setLastSaved,
          setBetaMessageDismissed,
          setMigrationMessageDismissed,
          setDarkMode,
          setTokens,
          setPairs
        ]
      )}
    >
      {children}
    </LocalStorageContext.Provider>
  )
}

export function Updater() {
  const [, { setDarkMode }] = useLocalStorageContext()

  useEffect(() => {
    const darkHandler = (match: MediaQueryListEvent) => {
      if (match.matches) {
        setDarkMode(true)
      }
    }
    const lightHandler = (match: MediaQueryListEvent) => {
      if (match.matches) {
        setDarkMode(false)
      }
    }

    window?.matchMedia('(prefers-color-scheme: dark)')?.addListener(darkHandler)
    window?.matchMedia('(prefers-color-scheme: light)')?.addListener(lightHandler)

    return () => {
      window?.matchMedia('(prefers-color-scheme: dark)')?.removeListener(darkHandler)
      window?.matchMedia('(prefers-color-scheme: light)')?.removeListener(lightHandler)
    }
  }, [setDarkMode])

  return null
}

export function useBetaMessageManager() {
  const [{ betaMessageDismissed }, { setBetaMessageDismissed }] = useLocalStorageContext()

  const dismissBetaMessage = useCallback(() => {
    setBetaMessageDismissed(true)
  }, [setBetaMessageDismissed])

  return [!betaMessageDismissed, dismissBetaMessage]
}

export function useMigrationMessageManager() {
  const [{ migrationMessageDismissed }, { setMigrationMessageDismissed }] = useLocalStorageContext()

  const dismissMigrationMessage = useCallback(() => {
    setMigrationMessageDismissed(true)
  }, [setMigrationMessageDismissed])

  return [!migrationMessageDismissed, dismissMigrationMessage]
}

export function useDarkModeManager() {
  const [{ darkMode }, { setDarkMode }] = useLocalStorageContext()

  const toggleSetDarkMode = useCallback(
    value => {
      setDarkMode(typeof value === 'boolean' ? value : !darkMode)
    },
    [darkMode, setDarkMode]
  )

  return [darkMode, toggleSetDarkMode]
}

export function useLocalStorageTokens(): [
  Token[],
  {
    fetchTokenByAddress: (address: string) => Promise<Token | null>
    addToken: (token: Token) => void
    removeTokenByAddress: (chainId: number, address: string) => void
  }
] {
  const { library, chainId } = useWeb3React()
  const [{ tokens }, { setTokens }] = useLocalStorageContext()

  const fetchTokenByAddress = useCallback(
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

  const addToken = useCallback(
    (token: Token) => {
      setTokens(tokens => tokens.filter(currentToken => !currentToken.equals(token)).concat([token]))
    },
    [setTokens]
  )

  const removeTokenByAddress = useCallback(
    (chainId: number, address: string) => {
      setTokens(tokens =>
        tokens.filter(
          currentToken => !(currentToken.chainId === chainId && currentToken.address === isAddress(address))
        )
      )
    },
    [setTokens]
  )

  return [tokens, { fetchTokenByAddress, addToken, removeTokenByAddress }]
}

const ZERO = JSBI.BigInt(0)
export function useLocalStoragePairAdder(): (pair: Pair) => void {
  const [, { setPairs }] = useLocalStorageContext()

  return useCallback(
    (pair: Pair) => {
      setPairs(pairs =>
        pairs
          .filter(tokens => !(tokens[0].equals(pair.token0) && tokens[1].equals(pair.token1)))
          .concat([[pair.token0, pair.token1]])
      )
    },
    [setPairs]
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

  const [{ pairs }] = useLocalStorageContext()
  const userPairs = useMemo(
    () =>
      pairs
        .filter(tokens => tokens[0].chainId === chainId)
        .map(tokens => new Pair(new TokenAmount(tokens[0], ZERO), new TokenAmount(tokens[1], ZERO))),
    [pairs, chainId]
  )

  return useMemo(() => {
    return (
      generatedPairs
        .concat(userPairs)
        // filter out duplicate pairs
        .filter((pair, i, concatenatedPairs) => {
          const firstAppearance = concatenatedPairs.findIndex(
            concatenatedPair =>
              concatenatedPair.token0.equals(pair.token0) && concatenatedPair.token1.equals(pair.token1)
          )
          return i === firstAppearance
        })
    )
  }, [generatedPairs, userPairs])
}

import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react'
import { Token, Pair, TokenAmount, JSBI } from '@uniswap/sdk'
import { getTokenDecimals, getTokenSymbol, getTokenName, isAddress } from '../utils'
import { useWeb3React } from '@web3-react/core'

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

export default function Provider({ children }) {
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
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(LocalStorageKeys.DARK_MODE, true)
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

export function useLocalStoragePairs(): [
  Pair[],
  {
    addPair: (pair: Pair) => void
  }
] {
  const [{ pairs }, { setPairs }] = useLocalStorageContext()

  const addPair = useCallback(
    (pair: Pair) => {
      setPairs(pairs =>
        pairs
          .filter(tokens => !(tokens[0].equals(pair.token0) && tokens[1].equals(pair.token1)))
          .concat([[pair.token0, pair.token1]])
      )
    },
    [setPairs]
  )

  return [
    useMemo(
      () =>
        pairs.map(
          tokens => new Pair(new TokenAmount(tokens[0], JSBI.BigInt(0)), new TokenAmount(tokens[1], JSBI.BigInt(0)))
        ),
      [pairs]
    ),
    { addPair }
  ]
}

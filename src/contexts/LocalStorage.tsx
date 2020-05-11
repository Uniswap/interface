import React, { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react'
import { Token } from '@uniswap/sdk'
import { getTokenDecimals, getTokenSymbol, getTokenName, isAddress } from '../utils'
import { useWeb3React } from '@web3-react/core'

enum LocalStorageKeys {
  VERSION = 'version',
  LAST_SAVED = 'lastSaved',
  BETA_MESSAGE_DISMISSED = 'betaMessageDismissed',
  MIGRATION_MESSAGE_DISMISSED = 'migrationMessageDismissed',
  DARK_MODE = 'darkMode',
  TOKENS = 'tokens'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeTokens(
  tokens: Token[]
): { chainId: number; address: string; decimals: number; symbol: string; name: string }[] {
  return tokens.map(token => ({
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeTokens(serializedTokens: ReturnType<typeof serializeTokens>): Token[] {
  return serializedTokens.map(
    serializedToken =>
      new Token(
        serializedToken.chainId,
        serializedToken.address,
        serializedToken.decimals,
        serializedToken.symbol,
        serializedToken.name
      )
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

  const [tokens, setTokens] = useLocalStorage<Token[], ReturnType<typeof serializeTokens>>(
    LocalStorageKeys.TOKENS,
    [],
    {
      serialize: serializeTokens,
      deserialize: deserializeTokens
    }
  )

  return (
    <LocalStorageContext.Provider
      value={useMemo(
        () => [
          { version, lastSaved, betaMessageDismissed, migrationMessageDismissed, darkMode, tokens },
          {
            setVersion,
            setLastSaved,
            setBetaMessageDismissed,
            setMigrationMessageDismissed,
            setDarkMode,
            setTokens
          }
        ],
        [
          version,
          lastSaved,
          betaMessageDismissed,
          migrationMessageDismissed,
          darkMode,

          tokens,
          setVersion,
          setLastSaved,
          setBetaMessageDismissed,
          setMigrationMessageDismissed,
          setDarkMode,
          setTokens
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

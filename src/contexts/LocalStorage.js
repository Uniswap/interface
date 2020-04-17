import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useAllTokens } from './Tokens'

const UNISWAP = 'UNISWAP'

const VERSION = 'VERSION'
const CURRENT_VERSION = 0
const LAST_SAVED = 'LAST_SAVED'

const BETA_MESSAGE_DISMISSED = 'BETA_MESSAGE_DISMISSED'
const MIGRATION_MESSAGE_DISMISSED = 'MIGRATION_MESSAGE_DISMISSED'
const DARK_MODE = 'DARK_MODE'
const TOKEN_LIST = 'TOKEN_LIST'

const UPDATABLE_KEYS = [BETA_MESSAGE_DISMISSED, MIGRATION_MESSAGE_DISMISSED, DARK_MODE]

const UPDATE_KEY = 'UPDATE_KEY'

const UPDATE_TOKEN_LIST = 'UPDATE_TOKEN_LIST'

const LocalStorageContext = createContext()

function useLocalStorageContext() {
  return useContext(LocalStorageContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE_KEY: {
      const { key, value } = payload
      if (!UPDATABLE_KEYS.some(k => k === key)) {
        throw Error(`Unexpected key in LocalStorageContext reducer: '${key}'.`)
      } else {
        return {
          ...state,
          [key]: value
        }
      }
    }
    case UPDATE_TOKEN_LIST: {
      const { tokenAddress, token } = payload
      return {
        ...state,
        [TOKEN_LIST]: {
          ...state?.[TOKEN_LIST],
          [tokenAddress]: token
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in LocalStorageContext reducer: '${type}'.`)
    }
  }
}

function init() {
  const defaultLocalStorage = {
    [VERSION]: CURRENT_VERSION,
    [BETA_MESSAGE_DISMISSED]: false,
    [MIGRATION_MESSAGE_DISMISSED]: false,
    [DARK_MODE]: false
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(UNISWAP))
    if (parsed[VERSION] !== CURRENT_VERSION) {
      // this is where we could run migration logic
      return defaultLocalStorage
    } else {
      return { ...defaultLocalStorage, ...parsed }
    }
  } catch {
    return defaultLocalStorage
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  const updateKey = useCallback((key, value) => {
    dispatch({ type: UPDATE_KEY, payload: { key, value } })
  }, [])

  const updateTokenList = useCallback((tokenAddress, token) => {
    dispatch({ type: UPDATE_TOKEN_LIST, payload: { tokenAddress, token } })
  }, [])

  return (
    <LocalStorageContext.Provider
      value={useMemo(() => [state, { updateKey, updateTokenList }], [state, updateKey, updateTokenList])}
    >
      {children}
    </LocalStorageContext.Provider>
  )
}

export function Updater() {
  const [state] = useLocalStorageContext()

  useEffect(() => {
    window.localStorage.setItem(UNISWAP, JSON.stringify({ ...state, [LAST_SAVED]: Math.floor(Date.now() / 1000) }))
  })

  return null
}

export function useBetaMessageManager() {
  const [state, { updateKey }] = useLocalStorageContext()

  const dismissBetaMessage = useCallback(() => {
    updateKey(BETA_MESSAGE_DISMISSED, true)
  }, [updateKey])

  return [!state[BETA_MESSAGE_DISMISSED], dismissBetaMessage]
}

export function useMigrationMessageManager() {
  const [state, { updateKey }] = useLocalStorageContext()

  const dismissMigrationMessage = useCallback(() => {
    updateKey(MIGRATION_MESSAGE_DISMISSED, true)
  }, [updateKey])

  return [!state[MIGRATION_MESSAGE_DISMISSED], dismissMigrationMessage]
}

export function useDarkModeManager() {
  const [state, { updateKey }] = useLocalStorageContext()

  let isDarkMode = state[DARK_MODE]

  const toggleDarkMode = useCallback(
    value => {
      updateKey(DARK_MODE, value === false || value === true ? value : !isDarkMode)
    },
    [updateKey, isDarkMode]
  )

  return [state[DARK_MODE], toggleDarkMode]
}

/**
 *  @todo is there a better place to store these? should we move into tokens context
 */
export function useSavedTokens() {
  const [state, { updateTokenList }] = useLocalStorageContext()
  const allTokens = useAllTokens()
  const userList = state?.[TOKEN_LIST] || []

  function addToken(tokenAddress) {
    const token = allTokens?.[tokenAddress]
    if (token) {
      updateTokenList(token.address, token)
    }
  }
  return [userList, addToken]
}

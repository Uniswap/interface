import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { safeAccess } from '../utils'

const SHOW_BETA_MESSAGE = 'SHOW_BETA_MESSAGE'
const BLOCK_NUMBERS = 'BLOCK_NUMBERS'

const DISMISS_BETA_MESSAGE = 'DISMISS_BETA_MESSAGE'
const UPDATE_BLOCK_NUMBER = 'UPDATE_BLOCK_NUMBER'

const ApplicationContext = createContext()

function useApplicationContext() {
  return useContext(ApplicationContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case DISMISS_BETA_MESSAGE: {
      return {
        ...state,
        [SHOW_BETA_MESSAGE]: false
      }
    }
    case UPDATE_BLOCK_NUMBER: {
      const { networkId, blockNumber } = payload
      return {
        ...state,
        [BLOCK_NUMBERS]: {
          ...(safeAccess(state, [BLOCK_NUMBERS]) || {}),
          [networkId]: blockNumber
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in ApplicationContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    [SHOW_BETA_MESSAGE]: true,
    [BLOCK_NUMBERS]: {}
  })

  const dismissBetaMessage = useCallback(() => {
    dispatch({ type: DISMISS_BETA_MESSAGE })
  }, [])
  const updateBlockNumber = useCallback((networkId, blockNumber) => {
    dispatch({ type: UPDATE_BLOCK_NUMBER, payload: { networkId, blockNumber } })
  }, [])

  const contextValue = useMemo(() => [state, { dismissBetaMessage, updateBlockNumber }], [
    state,
    dismissBetaMessage,
    updateBlockNumber
  ])

  return <ApplicationContext.Provider value={contextValue}>{children}</ApplicationContext.Provider>
}

export function Updater() {
  const { networkId, library } = useWeb3Context()

  const [, { updateBlockNumber }] = useApplicationContext()

  useEffect(() => {
    if ((networkId || networkId === 0) && library) {
      let stale = false

      function update() {
        library
          .getBlockNumber()
          .then(blockNumber => {
            if (!stale) {
              updateBlockNumber(networkId, blockNumber)
            }
          })
          .catch(() => {
            if (!stale) {
              updateBlockNumber(networkId, null)
            }
          })
      }

      update()
      library.on('block', update)

      return () => {
        stale = true
        library.removeListener('block', update)
      }
    }
  }, [networkId, library, updateBlockNumber])

  return null
}

export function useBetaMessageManager() {
  const [state, { dismissBetaMessage }] = useApplicationContext()

  return [safeAccess(state, [SHOW_BETA_MESSAGE]), dismissBetaMessage]
}

export function useBlockNumber() {
  const { networkId } = useWeb3Context()

  const [state] = useApplicationContext()

  return safeAccess(state, [BLOCK_NUMBERS, networkId])
}

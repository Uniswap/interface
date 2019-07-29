import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { safeAccess } from '../utils'

const BLOCK_NUMBERS = 'BLOCK_NUMBERS'

const UPDATE_BLOCK_NUMBER = 'UPDATE_BLOCK_NUMBER'

const ApplicationContext = createContext()

function useApplicationContext() {
  return useContext(ApplicationContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
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
    [BLOCK_NUMBERS]: {}
  })

  const updateBlockNumber = useCallback((networkId, blockNumber) => {
    dispatch({ type: UPDATE_BLOCK_NUMBER, payload: { networkId, blockNumber } })
  }, [])

  return (
    <ApplicationContext.Provider value={useMemo(() => [state, { updateBlockNumber }], [state, updateBlockNumber])}>
      {children}
    </ApplicationContext.Provider>
  )
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

export function useBlockNumber() {
  const { networkId } = useWeb3Context()

  const [state] = useApplicationContext()

  return safeAccess(state, [BLOCK_NUMBERS, networkId])
}

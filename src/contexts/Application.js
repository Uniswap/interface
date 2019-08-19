import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import { safeAccess } from '../utils'
import { getUSDPrice } from '../utils/price'

const BLOCK_NUMBER = 'BLOCK_NUMBER'
const USD_PRICE = 'USD_PRICE'

const UPDATE_BLOCK_NUMBER = 'UPDATE_BLOCK_NUMBER'
const UPDATE_USD_PRICE = 'UPDATE_USD_PRICE'

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
        [BLOCK_NUMBER]: {
          ...(safeAccess(state, [BLOCK_NUMBER]) || {}),
          [networkId]: blockNumber
        }
      }
    }
    case UPDATE_USD_PRICE: {
      const { networkId, USDPrice } = payload
      return {
        ...state,
        [USD_PRICE]: {
          ...(safeAccess(state, [USD_PRICE]) || {}),
          [networkId]: USDPrice
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
    [BLOCK_NUMBER]: {},
    [USD_PRICE]: {}
  })

  const updateBlockNumber = useCallback((networkId, blockNumber) => {
    dispatch({ type: UPDATE_BLOCK_NUMBER, payload: { networkId, blockNumber } })
  }, [])

  const updateUSDPrice = useCallback((networkId, USDPrice) => {
    dispatch({ type: UPDATE_USD_PRICE, payload: { networkId, USDPrice } })
  }, [])

  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateBlockNumber, updateUSDPrice }], [state, updateBlockNumber, updateUSDPrice])}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function Updater() {
  const { networkId, library, connectorName } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()
  const [, { updateBlockNumber, updateUSDPrice }] = useApplicationContext()

  // slow down polling interval
  useEffect(() => {
    if (library) {
      if (connectorName === 'Network') {
        library.pollingInterval = 15
      } else {
        library.pollingInterval = 5
      }
    }
  }, [library, connectorName])

  // update usd price
  useEffect(() => {
    let stale = false

    getUSDPrice(library)
      .then(([price]) => {
        if (!stale) {
          updateUSDPrice(networkId, price)
        }
      })
      .catch(() => {
        if (!stale) {
          updateUSDPrice(networkId, null)
        }
      })
  }, [globalBlockNumber, library, networkId, updateUSDPrice])

  // update block number
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

  return safeAccess(state, [BLOCK_NUMBER, networkId])
}

export function useUSDPrice() {
  const { networkId } = useWeb3Context()

  const [state] = useApplicationContext()

  return safeAccess(state, [USD_PRICE, networkId])
}

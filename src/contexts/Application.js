import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'

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
  const context = useWeb3React()
  const { library, chainId } = context

  const globalBlockNumber = useBlockNumber()
  const [, { updateBlockNumber, updateUSDPrice }] = useApplicationContext()

  // slow down polling interval
  // if (library && connectorName === 'Network' && library.pollingInterval !== 15) {
  //   library.pollingInterval = 15
  // } else if (library && library.pollingInterval !== 5) {
  //   library.pollingInterval = 5
  // }

  // update usd price
  useEffect(() => {
    if (library && chainId === 1) {
      let stale = false

      getUSDPrice(library)
        .then(([price]) => {
          if (!stale) {
            updateUSDPrice(chainId, price)
          }
        })
        .catch(() => {
          if (!stale) {
            updateUSDPrice(chainId, null)
          }
        })
    }
  }, [globalBlockNumber, library, chainId, updateUSDPrice])

  // update block number
  useEffect(() => {
    if (library) {
      let stale = false

      function update() {
        library
          .getBlockNumber()
          .then(blockNumber => {
            if (!stale) {
              updateBlockNumber(chainId, blockNumber)
            }
          })
          .catch(() => {
            if (!stale) {
              updateBlockNumber(chainId, null)
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
  }, [chainId, library, updateBlockNumber])

  return null
}

export function useBlockNumber() {
  const context = useWeb3React()
  const { chainId } = context

  const [state] = useApplicationContext()

  return safeAccess(state, [BLOCK_NUMBER, chainId])
}

export function useUSDPrice() {
  const context = useWeb3React()
  const { chainId } = context

  const [state] = useApplicationContext()

  return safeAccess(state, [USD_PRICE, chainId])
}

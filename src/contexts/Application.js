import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { useWeb3React } from '../hooks'
import { safeAccess } from '../utils'
import { getUSDPrice } from '../utils/price'

const BLOCK_NUMBER = 'BLOCK_NUMBER'
const USD_PRICE = 'USD_PRICE'
const WALLET_MODAL_OPEN = 'WALLET_MODAL_OPEN'

const UPDATE_BLOCK_NUMBER = 'UPDATE_BLOCK_NUMBER'
const UPDATE_USD_PRICE = 'UPDATE_USD_PRICE'
const TOGGLE_WALLET_MODAL = 'TOGGLE_WALLET_MODAL'

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
    case TOGGLE_WALLET_MODAL: {
      return { ...state, [WALLET_MODAL_OPEN]: !state[WALLET_MODAL_OPEN] }
    }
    default: {
      throw Error(`Unexpected action type in ApplicationContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    [BLOCK_NUMBER]: {},
    [USD_PRICE]: {},
    [WALLET_MODAL_OPEN]: false
  })

  const updateBlockNumber = useCallback((networkId, blockNumber) => {
    dispatch({ type: UPDATE_BLOCK_NUMBER, payload: { networkId, blockNumber } })
  }, [])

  const updateUSDPrice = useCallback((networkId, USDPrice) => {
    dispatch({ type: UPDATE_USD_PRICE, payload: { networkId, USDPrice } })
  }, [])

  const toggleWalletModal = useCallback(() => {
    dispatch({ type: TOGGLE_WALLET_MODAL })
  }, [])

  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateBlockNumber, updateUSDPrice, toggleWalletModal }], [
        state,
        updateBlockNumber,
        updateUSDPrice,
        toggleWalletModal
      ])}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function Updater() {
  const { library, chainId } = useWeb3React()

  const globalBlockNumber = useBlockNumber()
  const [, { updateBlockNumber, updateUSDPrice }] = useApplicationContext()

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
  const { chainId } = useWeb3React()

  const [state] = useApplicationContext()

  return safeAccess(state, [BLOCK_NUMBER, chainId])
}

export function useUSDPrice() {
  const { chainId } = useWeb3React()

  const [state] = useApplicationContext()

  return safeAccess(state, [USD_PRICE, chainId])
}

export function useWalletModalOpen() {
  const [state] = useApplicationContext()

  return state[WALLET_MODAL_OPEN]
}

export function useWalletModalToggle() {
  const [, { toggleWalletModal }] = useApplicationContext()

  return toggleWalletModal
}

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'

import { useWeb3React } from '../hooks'
import { safeAccess } from '../utils'

const BLOCK_NUMBER = 'BLOCK_NUMBER'
const USD_PRICE = 'USD_PRICE'
const WALLET_MODAL_OPEN = 'WALLET_MODAL_OPEN'
const POPUP_LIST = 'POPUP_LIST'

const UPDATE_BLOCK_NUMBER = 'UPDATE_BLOCK_NUMBER'
const TOGGLE_WALLET_MODAL = 'TOGGLE_WALLET_MODAL'

const ADD_POPUP = 'ADD_POPUP'

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

    case TOGGLE_WALLET_MODAL: {
      return { ...state, [WALLET_MODAL_OPEN]: !state[WALLET_MODAL_OPEN] }
    }

    case ADD_POPUP: {
      const { newList } = payload
      return { ...state, [POPUP_LIST]: newList }
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
    [POPUP_LIST]: [],
    [WALLET_MODAL_OPEN]: false
  })

  const updateBlockNumber = useCallback((networkId, blockNumber) => {
    dispatch({ type: UPDATE_BLOCK_NUMBER, payload: { networkId, blockNumber } })
  }, [])

  const toggleWalletModal = useCallback(() => {
    dispatch({ type: TOGGLE_WALLET_MODAL })
  }, [])

  const setPopups = useCallback(newList => {
    dispatch({ type: ADD_POPUP, payload: { newList } })
  }, [])

  return (
    <ApplicationContext.Provider
      value={useMemo(() => [state, { updateBlockNumber, toggleWalletModal, setPopups }], [
        state,
        updateBlockNumber,
        toggleWalletModal,
        setPopups
      ])}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function Updater() {
  const { library, chainId } = useWeb3React()

  const [, { updateBlockNumber }] = useApplicationContext()

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

export function useWalletModalOpen() {
  const [state] = useApplicationContext()

  return state[WALLET_MODAL_OPEN]
}

export function useWalletModalToggle() {
  const [, { toggleWalletModal }] = useApplicationContext()

  return toggleWalletModal
}

export function usePopups() {
  const [state, { setPopups }] = useApplicationContext()

  const [index, setIndex] = useState(0)

  const currentPopups = state[POPUP_LIST]

  function addPopup(content) {
    const newItem = {
      show: true,
      key: index,
      content: content
    }
    currentPopups.push(newItem)
    setPopups(currentPopups)
    setIndex(index + 1)
  }

  function removePopup(key) {
    currentPopups.map(item => {
      if (key === item.key) {
        item.show = false
      }
    })
    setPopups(currentPopups)
  }

  const activePopups = currentPopups.filter(item => {
    return item.show
  })

  return [activePopups, addPopup, removePopup]
}

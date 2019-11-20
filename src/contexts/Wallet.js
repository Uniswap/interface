import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'

const WALLET_MODAL_ERROR = 'WALLET_MODAL_ERROR'
const WALLET_MODAL_OPEN = 'WALLET_MODAL_OPEN'
const WALLET_MODAL_OPEN_ERROR = 'WALLET_MODAL_OPEN_ERROR'
const WALLET_MODAL_CLOSE = 'WALLET_MODAL_CLOSE'

const WalletModalContext = createContext()

export function useWalletModalContext() {
  return useContext(WalletModalContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case WALLET_MODAL_ERROR: {
      const { error } = payload
      return { ...state, walletError: error }
    }
    case WALLET_MODAL_OPEN: {
      return { ...state, open: true }
    }
    case WALLET_MODAL_OPEN_ERROR: {
      const { error } = payload || {}
      return { open: true, walletError: error }
    }
    case WALLET_MODAL_CLOSE: {
      return { ...state, open: false }
    }
    default: {
      throw Error(`Unexpected action type in walletModalReducer reducer: '${type}'.`)
    }
  }
}

const walletModalInitialState = {
  open: false,
  walletError: undefined
}

export default function Provider({ children }) {
  const [{ open: walletModalIsOpen, walletError: walletModalError }, dispatch] = useReducer(
    reducer,
    walletModalInitialState
  )

  const setWalletError = useCallback(error => {
    dispatch({ type: WALLET_MODAL_ERROR, payload: { error } })
  }, [])

  const openWalletModal = useCallback(error => {
    dispatch({ type: WALLET_MODAL_OPEN, ...(error ? { payload: { error } } : {}) })
  }, [])

  const closeWalletModal = useCallback(() => {
    dispatch({ type: WALLET_MODAL_CLOSE })
  }, [])

  return (
    <WalletModalContext.Provider
      value={useMemo(
        () => [
          { open: walletModalIsOpen, walletError: walletModalError, setWalletError, openWalletModal, closeWalletModal }
        ],
        [walletModalIsOpen, walletModalError, setWalletError, openWalletModal, closeWalletModal]
      )}
    >
      {children}
    </WalletModalContext.Provider>
  )
}

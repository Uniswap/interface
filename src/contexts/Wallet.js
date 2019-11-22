import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'

const WALLET_MODAL_ERROR = 'WALLET_MODAL_ERROR'

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
  const [{ walletError: walletModalError }, dispatch] = useReducer(reducer, walletModalInitialState)

  const setWalletError = useCallback(error => {
    dispatch({ type: WALLET_MODAL_ERROR, payload: { error } })
  }, [])

  return (
    <WalletModalContext.Provider
      value={useMemo(() => [{ walletError: walletModalError, setWalletError }], [walletModalError, setWalletError])}
    >
      {children}
    </WalletModalContext.Provider>
  )
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react'
import type {
  AccountsData,
  AccountsGetters,
  AccountsState,
  AccountsStore,
} from 'uniswap/src/features/accounts/store/types/AccountsState'
import { isDevEnv } from 'utilities/src/environment/env'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type CreateGettersFn<TData extends AccountsData, TGetters extends AccountsGetters> = (getState: () => TData) => TGetters

interface CreateAccountsStoreContextProviderParams<TData extends AccountsData, TGetters extends AccountsGetters> {
  useAppAccountsState: () => TData
  createGetters: CreateGettersFn<TData, TGetters>
}

interface CreateAccountsStoreContextProviderReturn<TData extends AccountsData, TGetters extends AccountsGetters> {
  AccountsStoreContextProvider: React.FC<PropsWithChildren>
  useAccountsStoreContext: () => AccountsStore<TData, TGetters>
}

/**
 * Factory function that creates a React context provider and hook for accounts store management.
 * Provides a Zustand store that syncs with app-specific state and exposes getter functions.
 */

export function createAccountsStoreContextProvider<TData extends AccountsData, TGetters extends AccountsGetters>(
  params: CreateAccountsStoreContextProviderParams<TData, TGetters>,
): CreateAccountsStoreContextProviderReturn<TData, TGetters> {
  const { useAppAccountsState, createGetters } = params

  const AccountsStoreContext = createContext<AccountsStore<TData, TGetters> | undefined>(undefined)

  function AccountsStoreContextProvider({ children }: PropsWithChildren): ReactNode {
    const state = useAppAccountsState()

    const [store] = useState(() => createAccountsStore({ initialState: state, createGetters }))

    useEffect(() => store.setState((oldState) => ({ ...oldState, ...state })), [state, store])

    return <AccountsStoreContext.Provider value={store}>{children}</AccountsStoreContext.Provider>
  }

  function useAccountsStoreContext() {
    const context = useContext(AccountsStoreContext)
    if (!context) {
      throw new Error('useAccountsStoreContext must be used within an AccountsStoreProvider')
    }
    return context
  }

  return { AccountsStoreContextProvider, useAccountsStoreContext }
}

type CreateAccountsStoreParams<TData extends AccountsData, TGetters extends AccountsGetters> = {
  initialState: TData
  createGetters: (getState: () => TData) => TGetters
}

function createAccountsStore<TData extends AccountsData, TGetters extends AccountsGetters>(
  params: CreateAccountsStoreParams<TData, TGetters>,
): AccountsStore<TData, TGetters> {
  const { initialState, createGetters } = params

  const store = create<AccountsState<TData, TGetters>>()(
    devtools<AccountsState<TData, TGetters>>(
      (_set, get) => {
        const getters = createGetters(get)
        return { ...initialState, ...getters }
      },
      {
        name: 'useAccountsStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  return store
}

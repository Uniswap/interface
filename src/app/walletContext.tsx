import React, { createContext, PropsWithChildren, useContext } from 'react'
import { ProviderManager } from 'src/chains/ProviderManager'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { getContext } from 'typed-redux-saga'

export interface WalletContextValue {
  accounts: AccountManager
  providers: ProviderManager
}

export const walletContextValue: WalletContextValue = {
  accounts: new AccountManager(),
  providers: new ProviderManager(),
}

export const WalletContext = createContext<WalletContextValue>(walletContextValue)

export const WalletContextProvider = ({ children }: PropsWithChildren<any>) => {
  return <WalletContext.Provider value={walletContextValue}>{children}</WalletContext.Provider>
}

export function useWalletContext(): WalletContextValue {
  return useContext(WalletContext)
}

export function useWalletAccounts(): AccountManager {
  return useContext(WalletContext).accounts
}

export function* getWalletAccounts() {
  const value = yield* getContext<AccountManager>('accounts')
  return value
}

export function useWalletProviders(): ProviderManager {
  return useContext(WalletContext).providers
}

export function* getWalletProviders() {
  const value = yield* getContext<ProviderManager>('providers')
  return value
}

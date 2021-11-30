import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { ChainId } from 'src/constants/chains'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { logger } from 'src/utils/logger'
import { getContext } from 'typed-redux-saga'

export interface WalletContextValue {
  accounts: AccountManager
  providers: ProviderManager
  contracts: ContractManager
}

export const walletContextValue: WalletContextValue = {
  accounts: new AccountManager(),
  providers: new ProviderManager(),
  contracts: new ContractManager(),
}

export const WalletContext = createContext<{ value: WalletContextValue; version: number }>({
  value: walletContextValue,
  version: 0,
})

export const WalletContextProvider = ({ children }: PropsWithChildren<any>) => {
  // This state allows the managers to trigger re-renders when relevant values change (i.e. new provider ready)
  // Probably not strictly necessary but more robust than relying on 'organic' re-renders
  const [contextVersion, updateContextVersion] = useState(0)
  const incrementContextVersion = useCallback(() => {
    logger.debug(
      'walletContext',
      'WalletContextProvider',
      `Context update count: ${contextVersion + 1}`
    )
    updateContextVersion(contextVersion + 1)
  }, [contextVersion, updateContextVersion])
  useEffect(() => {
    walletContextValue.providers.setOnUpdate(incrementContextVersion)
  }, [incrementContextVersion])

  return (
    <WalletContext.Provider value={{ value: walletContextValue, version: contextVersion }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext(): WalletContextValue {
  return useContext(WalletContext).value
}

export function useWalletAccounts(): AccountManager {
  return useContext(WalletContext).value.accounts
}

export function useWalletAccount(address: string) {
  return useWalletAccounts().tryGetAccount(address)
}

export function* getWalletAccounts() {
  const value = yield* getContext<AccountManager>('accounts')
  return value
}

export function useWalletProviders(): ProviderManager {
  return useContext(WalletContext).value.providers
}

export function useWalletProvider(chainId: ChainId) {
  return useWalletProviders().tryGetProvider(chainId)
}

export function* getWalletProviders() {
  const value = yield* getContext<ProviderManager>('providers')
  return value
}

export function useWalletContracts(): ContractManager {
  return useContext(WalletContext).value.contracts
}

export function* getWalletContracts() {
  const value = yield* getContext<ContractManager>('contracts')
  return value
}

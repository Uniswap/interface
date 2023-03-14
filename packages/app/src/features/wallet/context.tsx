/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { call, getContext } from 'typed-redux-saga'
import { ChainId } from '../chains/chains'

import { ContractManager } from '../contracts/ContractManager'
import { logger } from '../logger/logger'
import { ProviderManager } from '../providers/ProviderManager'
import { SignerManager } from './signing/SignerManager'

export interface WalletContextValue {
  signers: SignerManager
  providers: ProviderManager
  contracts: ContractManager
}

export const walletContextValue: WalletContextValue = {
  signers: new SignerManager(),
  providers: new ProviderManager(),
  contracts: new ContractManager(),
}

export const WalletContext = createContext<{
  value: WalletContextValue
  version: number
}>({
  value: walletContextValue,
  version: 0,
})

export function WalletContextProvider({
  children,
}: PropsWithChildren<unknown>): JSX.Element {
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
    <WalletContext.Provider
      value={{ value: walletContextValue, version: contextVersion }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletSigners(): SignerManager {
  return useContext(WalletContext).value.signers
}

export function* getSignerManager() {
  return yield* getContext<SignerManager>('signers') ??
    walletContextValue.signers
}

export function useProviderManager(): ProviderManager {
  return useContext(WalletContext).value.providers
}

export function useProvider(chainId: ChainId) {
  return useProviderManager().tryGetProvider(chainId)
}

export function* getProviderManager() {
  // TODO: is there a better way to handle when execution context is not react?
  return yield* getContext<ProviderManager>('providers') ??
    walletContextValue.providers
}

export function* getProvider(chainId: ChainId) {
  const providerManager = yield* call(getProviderManager)
  // Note, unlike useWalletProvider above, this throws on missing provider
  return providerManager.getProvider(chainId)
}

export function useContractManager(): ContractManager {
  return (
    useContext(WalletContext).value.contracts ?? walletContextValue.contracts
  )
}

export function* getContractManager() {
  const contracts = yield* getContext<ContractManager>('contracts')
  return contracts
}

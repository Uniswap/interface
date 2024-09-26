/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Signer } from 'ethers'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { call, getContext } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export interface WalletContextValue {
  // Manages contracts
  contracts: ContractManager
  // Manages ethers.Providers
  providers: ProviderManager
  // Provides secure key management and signing capability
  signers: SignerManager
}

export const walletContextValue: WalletContextValue = {
  contracts: new ContractManager(),
  providers: new ProviderManager(),
  signers: new SignerManager(),
}

export const WalletContext = createContext<{
  value: WalletContextValue
  version: number
}>({
  value: walletContextValue,
  version: 0,
})

export function WalletContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  // This state allows the managers to trigger re-renders when relevant values change (i.e. new provider ready)
  // Probably not strictly necessary but more robust than relying on 'organic' re-renders
  const [contextVersion, updateContextVersion] = useState(0)
  const incrementContextVersion = useCallback(() => {
    logger.debug('walletContext', 'WalletContextProvider', `Context update count: ${contextVersion + 1}`)
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

export function useWalletSigners(): SignerManager {
  return useContext(WalletContext).value.signers
}

export function* getSignerManager() {
  return yield* getContext<SignerManager>('signers') ?? walletContextValue.signers
}

export function useProviderManager(): ProviderManager {
  return useContext(WalletContext).value.providers
}

export function useProvider(chainId: WalletChainId) {
  return useProviderManager().tryGetProvider(chainId)
}

export function* getProviderManager() {
  // TODO: is there a better way to handle when execution context is not react?
  return (yield* getContext<ProviderManager>('providers')) ?? walletContextValue.providers
}

export function* getProvider(chainId: WalletChainId) {
  const providerManager = yield* call(getProviderManager)
  // Note, unlike useWalletProvider above, this throws on missing provider
  return providerManager.getProvider(chainId)
}

export function* getPrivateProvider(chainId: WalletChainId, account?: SignerMnemonicAccountMeta) {
  let signer: Signer | undefined
  if (account) {
    const signerManager = yield* call(getSignerManager)
    signer = yield* call([signerManager, signerManager.getSignerForAccount], account)
  }
  const providerManager = yield* call(getProviderManager)
  return yield* call([providerManager, providerManager.getPrivateProvider], chainId, signer)
}

/**
 * Non-generator version of getProvider
 */
export function getProviderSync(chainId: WalletChainId) {
  return walletContextValue.providers.getProvider(chainId)
}

export function useContractManager(): ContractManager {
  return useContext(WalletContext).value.contracts ?? walletContextValue.contracts
}

export function* getContractManager() {
  const contracts = yield* getContext<ContractManager>('contracts')
  return contracts
}

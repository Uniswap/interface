import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from 'ethers/lib/ethers'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { AccountMeta } from 'uniswap/src/features/accounts/types'

/** Stores objects/utils that exist on all platforms, abstracting away app-level specifics for each, in order to allow usage in cross-platform code. */
interface UniswapContext {
  useProviderHook: (chainId: number) => JsonRpcProvider | undefined
  signer: Signer | undefined
  account?: AccountMeta
  throwOnUse?: boolean
}

const UniswapContext = createContext<UniswapContext | null>(null)

export function UniswapProvider({
  children,
  useProviderHook,
  signer,
  account,
  throwOnUse = false,
}: PropsWithChildren<UniswapContext>): JSX.Element {
  const value: UniswapContext = useMemo(
    () => ({ account, signer, useProviderHook, throwOnUse }),
    [account, signer, useProviderHook, throwOnUse],
  )

  return <UniswapContext.Provider value={value}>{children}</UniswapContext.Provider>
}

/** Cross-platform util for getting items/utils that exist on all apps. */
export function useUniswapContext(): UniswapContext {
  const context = useContext(UniswapContext)
  if (!context) {
    throw new Error('useUniswapContext must be used within a UniswapProvider')
  } else if (context.throwOnUse) {
    throw new Error('a component is accessing useUniswapContext while throwOnUse is true')
  }

  return context
}

/** Cross-platform util for getting metadata for the active account/wallet, regardless of platform/environment. */
export function useAccountMeta(): AccountMeta | undefined {
  return useUniswapContext().account
}

/** Cross-platform util for getting an RPC provider for the given `chainId`, regardless of platform/environment. */
export function useProvider(chainId: number): JsonRpcProvider | undefined {
  return useUniswapContext().useProviderHook(chainId)
}

/** Cross-platform util for getting a signer for the active account/wallet, regardless of platform/environment. */
export function useSigner(): Signer | undefined {
  return useUniswapContext().signer
}

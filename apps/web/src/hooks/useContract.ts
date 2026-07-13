import { Contract } from '@ethersproject/contracts'
import { useMemo } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getContract } from 'utilities/src/contracts/getContract'
import { logger } from 'utilities/src/logger/logger'
import { type ChainContract, createContract, erc20Abi, getAddress, wethAbi, type WethAbi } from '~/chains'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider, useEthersWeb3Provider } from '~/hooks/useEthersProvider'

// returns null on errors
export function useContract<T extends Contract = Contract>({
  address,
  ABI,
  withSignerIfPossible = true,
  chainId,
}: {
  address?: string
  ABI: any
  withSignerIfPossible?: boolean
  chainId?: UniverseChainId
}): T | null {
  const account = useAccount()
  const readProvider = useEthersProvider({ chainId: chainId ?? account.chainId })
  // Signer contracts must use the wallet's provider; read contracts use the app's
  // read provider (UniRPC). The signer can only come from the connector client, so
  // `account` is attached only when that client exists — never to the read provider.
  const walletProvider = useEthersWeb3Provider({ chainId: chainId ?? account.chainId })

  return useMemo(() => {
    const withSigner = Boolean(withSignerIfPossible && account.address && walletProvider)
    const provider = withSigner ? walletProvider : readProvider
    if (!address || !ABI || !provider) {
      return null
    }
    try {
      return getContract({
        address,
        ABI,
        provider,
        account: withSigner ? account.address : undefined,
      })
    } catch (error) {
      const wrappedError = new Error('failed to get contract', { cause: error })
      logger.warn('useContract', 'useContract', wrappedError.message, {
        error: wrappedError,
        contractAddress: address,
        accountAddress: account.address,
      })
      return null
    }
  }, [address, ABI, readProvider, walletProvider, withSignerIfPossible, account.address]) as T
}

/**
 * ERC20 token contract handle
 */
export function useTokenContract({
  tokenAddress,
  withSignerIfPossible = false,
  chainId,
}: {
  tokenAddress?: string
  withSignerIfPossible?: boolean
  chainId?: UniverseChainId
}): ChainContract<typeof erc20Abi> | null {
  const account = useAccount()
  const chainIdToUse = chainId ?? account.chainId
  const readProvider = useEthersProvider({ chainId: chainIdToUse })
  // Writes sign through the wallet's provider; reads stay on the app's read
  // provider (UniRPC) so they never route through connector RPC endpoints.
  const walletProvider = useEthersWeb3Provider({ chainId: chainIdToUse })

  return useMemo(() => {
    const provider = readProvider ?? walletProvider
    if (!tokenAddress || !provider) {
      return null
    }
    const address = getAddress(tokenAddress)
    if (withSignerIfPossible && walletProvider && account.address) {
      return createContract({
        address,
        abi: erc20Abi,
        provider,
        signer: walletProvider.getSigner(account.address),
        signerAddress: account.address,
      })
    }
    return createContract({ address, abi: erc20Abi, provider })
  }, [tokenAddress, withSignerIfPossible, account.address, walletProvider, readProvider])
}

/**
 * WETH contract handle through the `@universe/chains` seam, viem-shaped
 * surface (`write.deposit({ value })`), engine selected by feature flag.
 */
export function useWETHContract({
  withSignerIfPossible,
  chainId,
}: {
  withSignerIfPossible?: boolean
  chainId?: UniverseChainId
}): ChainContract<WethAbi> | null {
  const account = useAccount()
  const chainIdToUse = chainId ?? account.chainId
  const readProvider = useEthersProvider({ chainId: chainIdToUse })
  // Writes sign through the wallet's provider; reads stay on the app's read
  // provider (UniRPC) so they never route through connector RPC endpoints.
  const walletProvider = useEthersWeb3Provider({ chainId: chainIdToUse })
  const wethAddress = chainIdToUse ? WRAPPED_NATIVE_CURRENCY[chainIdToUse]?.address : undefined

  return useMemo(() => {
    const provider = readProvider ?? walletProvider
    if (!wethAddress || !provider) {
      return null
    }
    const address = getAddress(wethAddress)
    if (withSignerIfPossible && walletProvider && account.address) {
      return createContract({
        address,
        abi: wethAbi,
        provider,
        signer: walletProvider.getSigner(account.address),
        signerAddress: account.address,
      })
    }
    return createContract({ address, abi: wethAbi, provider })
  }, [wethAddress, withSignerIfPossible, account.address, walletProvider, readProvider])
}

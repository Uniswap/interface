import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { type ChainContract, createContract, erc20Abi, getAddress, wethAbi, type WethAbi } from '~/chains'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider, useEthersWeb3Provider } from '~/hooks/useEthersProvider'

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

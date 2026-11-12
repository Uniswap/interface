import { MERKLE_DISTRIBUTOR_ADDRESS } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { type ChainContract, createContract, getAddress } from '~/chains'
import { useAccount } from '~/connection/hooks/useAccount'
import { useEthersProvider, useEthersWeb3Provider } from '~/connection/hooks/useEthersProvider'
import { merkleDistributorAbi } from '~/features/wallet/claim/constants'

export function useMerkleDistributorContract(): ChainContract<typeof merkleDistributorAbi> | null {
  const account = useAccount()
  const chainId = account.chainId
  const readProvider = useEthersProvider({ chainId })
  // Writes sign through the wallet's provider; reads stay on the app's read
  // provider (UniRPC) so they never route through connector RPC endpoints.
  const walletProvider = useEthersWeb3Provider({ chainId })
  const distributorAddress = chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined

  return useMemo(() => {
    const provider = readProvider ?? walletProvider
    if (!distributorAddress || !provider) {
      return null
    }
    const address = getAddress(distributorAddress)
    if (walletProvider && account.address) {
      return createContract({
        address,
        abi: merkleDistributorAbi,
        provider,
        signer: walletProvider.getSigner(account.address),
        signerAddress: account.address,
      })
    }
    return createContract({ address, abi: merkleDistributorAbi, provider })
  }, [distributorAddress, account.address, walletProvider, readProvider])
}

import { BigNumber } from '@ethersproject/bignumber'
import { hexStripZeros } from '@ethersproject/bytes'
import { Web3Provider } from '@ethersproject/providers'
import { L1ChainInfo, L2ChainInfo, SupportedChainId } from 'constants/chains'

interface AddNetworkArguments {
  library: Web3Provider
  chainId: SupportedChainId
  info: L1ChainInfo | L2ChainInfo
}

// provider.request returns Promise<any>, but wallet_switchEthereumChain must return null or throw
// see https://github.com/rekmarks/EIPs/blob/3326-create/EIPS/eip-3326.md for more info on wallet_switchEthereumChain
export async function addNetwork({ library, chainId, info }: AddNetworkArguments): Promise<null | void> {
  if (!library?.provider?.request) {
    return
  }
  const formattedChainId = hexStripZeros(BigNumber.from(chainId).toHexString())
  try {
    await library?.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: formattedChainId }],
    })
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await library?.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: formattedChainId,
              chainName: info.label,
              rpcUrls: [info.addNetworkInfo.rpcUrl],
              nativeCurrency: info.addNetworkInfo.nativeCurrency,
              blockExplorerUrls: [info.explorer],
            },
          ],
        })
      } catch (addError) {
        console.error('RPC failed to add Ethereum network:', chainId, info, addError)
      }
    }
    // handle other "switch" errors
  }
}

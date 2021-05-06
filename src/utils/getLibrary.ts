import { Web3Provider } from '@ethersproject/providers'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'

export default function getLibrary(
  provider: any,
  connector?: Required<Web3ReactContextInterface>['connector']
): Web3Provider {
  // todo: need to add types to this function and fix the issue with latest version of ethers not able to detect network if we pass in 'any'
  const chainId =
    provider?.chainId ?? connector?.supportedChainIds?.length === 1 ? connector?.supportedChainIds?.[0] : undefined
  // latest ethers version tries to detect the network which fails
  const library = new Web3Provider(
    provider,
    typeof chainId === 'number' ? chainId : typeof chainId === 'string' ? parseInt(chainId) : 'any'
  )
  library.pollingInterval = 15000
  return library
}

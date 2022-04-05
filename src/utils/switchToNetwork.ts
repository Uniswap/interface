import { SupportedChainId } from 'constants/chains'
import { BigNumber, utils } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import Swal from 'sweetalert2'
import ReactGA from 'react-ga'
interface SwitchNetworkArguments {
  library: Web3Provider
  chainId: SupportedChainId
  account?: string
}

// provider.request returns Promise<any>, but wallet_switchEthereumChain must return null or throw
// see https://github.com/rekmarks/EIPs/blob/3326-create/EIPS/eip-3326.md for more info on wallet_switchEthereumChain
export async function switchToNetwork({ library, chainId, account }: SwitchNetworkArguments): Promise<null | void> {
  const switchFn = async () => {
    if (!library?.provider?.request) {
      return
    }
    const formattedChainId = utils.hexStripZeros(BigNumber.from(chainId).toHexString())
    ReactGA.event({
      category: 'Network',
      action: 'Switch Network ' + (chainId === 1 ?
        'to Ethereum from Binance Smart Chain'
        : chainId === 56 ?
          'to Binance Smart Chain from Ethereum'
          : ''),
    })
    return library?.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: formattedChainId }],
    }).then(() => window.location.reload())
  }
  await switchFn()
}

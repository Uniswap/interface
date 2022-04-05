import { SupportedChainId } from 'constants/chains'
import { BigNumber, utils } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import Swal from 'sweetalert2'

interface SwitchNetworkArguments {
  library: Web3Provider
  chainId: SupportedChainId
}

// provider.request returns Promise<any>, but wallet_switchEthereumChain must return null or throw
// see https://github.com/rekmarks/EIPs/blob/3326-create/EIPS/eip-3326.md for more info on wallet_switchEthereumChain
export async function switchToNetwork({ library, chainId }: SwitchNetworkArguments): Promise<null | void> {
  const switchFn = async () => {
    if (!library?.provider?.request) {
      return
    }
    localStorage.removeItem('trumpBalance');
    const formattedChainId = utils.hexStripZeros(BigNumber.from(chainId).toHexString())
    return library?.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: formattedChainId }],
    })
  }

  const trackedValue = localStorage.getItem('trumpBalance');
  if (trackedValue) {
    const trackedValueParsed = parseFloat(trackedValue);
    if (trackedValueParsed > 0) {
      const { isConfirmed } = await Swal.fire({
        title: "Are you sure?",
        text: "Switching networks will stop your current gains tracking session.",
        confirmButtonText: "Okay",
        cancelButtonText: "Cancel",
        confirmButtonColor: '#991816',
        cancelButtonColor: '#444',
        showCancelButton: true,
        icon: "question",
      })

      if (isConfirmed) await switchFn()
      return;
    } 
    else await switchFn()
  } 
  else await switchFn()

}

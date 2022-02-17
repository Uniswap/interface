import { Provider as EthersProvider } from '@ethersproject/abstract-provider'
import { Signer as EthersSigner } from '@ethersproject/abstract-signer'
import { VoidSigner } from '@ethersproject/abstract-signer'
import { Eip1193Bridge } from '@ethersproject/experimental'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Provider as Eip1193Provider } from '@web3-react/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { useMemo } from 'react'

const voidSigner = new VoidSigner(ZERO_ADDRESS)

export default function useEip1193Provider(
  provider?: Eip1193Provider | EthersProvider | JsonRpcProvider | { provider: EthersProvider; signer: EthersSigner }
): Eip1193Provider | undefined {
  return useMemo(() => {
    if (provider) {
      if (provider instanceof EthersProvider) {
        // A JsonRpcProvider includes its own Signer, otherwise use a VoidSigner.
        const signer = 'getSigner' in provider ? provider.getSigner() : null ?? voidSigner
        return new Eip1193Bridge(signer, provider)
      }

      if ('provider' in provider && 'signer' in provider) {
        return new Eip1193Bridge(provider.signer, provider.provider)
      }

      // See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md.
      if ('request' in provider && 'on' in provider && 'removeListener' in provider) {
        return provider
      }
    }
    return
  }, [provider])
}

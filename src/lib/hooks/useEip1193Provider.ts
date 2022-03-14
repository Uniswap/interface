import { Provider as EthersProvider } from '@ethersproject/abstract-provider'
import { VoidSigner } from '@ethersproject/abstract-signer'
import { Eip1193Bridge as ExperimentalEip1193Bridge } from '@ethersproject/experimental'
import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Provider as Eip1193Provider } from '@web3-react/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { useMemo } from 'react'

const voidSigner = new VoidSigner(ZERO_ADDRESS)

class Eip1193Bridge extends ExperimentalEip1193Bridge {
  async send(method: string, params?: Array<any>): Promise<any> {
    switch (method) {
      case 'eth_chainId': {
        // TODO(https://github.com/ethers-io/ethers.js/pull/2711): Returns eth_chainId as a hexadecimal.
        const result = await this.provider.getNetwork()
        return '0x' + result.chainId.toString(16)
      }
      case 'eth_requestAccounts':
        try {
          return await super.send(method, params)
        } catch (e) {
          return this.send('eth_accounts')
        }
      case 'eth_sendTransaction': {
        if (!this.signer) break

        // TODO(zzmp): JsonRpcProvider filters from/gas fields from the params.
        const req = JsonRpcProvider.hexlifyTransaction(params?.[0], { from: true, gas: true })
        const tx = await this.signer.sendTransaction(req)
        return tx.hash
      }
      default:
        return super.send(method, params)
    }
  }
}

interface EthersSigningProvider extends EthersProvider {
  getSigner(): JsonRpcSigner
}

export default function useEip1193Provider(
  provider?: Eip1193Provider | EthersSigningProvider | EthersProvider
): Eip1193Provider | undefined {
  return useMemo(() => {
    if (provider) {
      if (EthersProvider.isProvider(provider)) {
        const signer = 'getSigner' in provider ? provider.getSigner() : null ?? voidSigner
        return new Eip1193Bridge(signer, provider)
      } else if (EthersProvider.isProvider((provider as ExperimentalEip1193Bridge).provider)) {
        /*
         * Direct users to use our own wrapper to avoid any pitfalls:
         * - Eip1193Bridge is experimental
         * - signer is not straightforward
         * - bugs out if chainId>8
         */
        throw new Error('Eip1193Bridge is experimental: pass your ethers Provider directly')
      }
    }
    return provider
  }, [provider])
}

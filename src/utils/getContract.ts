import { Signer } from '@ethersproject/abstract-signer'
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'

import { isAddress } from './addresses'

export function getContract(address: string, ABI: any, provider: Provider | Signer): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, provider)
}

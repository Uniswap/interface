import { Signer } from '@ethersproject/abstract-signer'
import { AddressZero } from '@ethersproject/constants'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { isAddress } from 'utilities/src/addresses'

export function getContract(
  address: string,
  ABI: ContractInterface,
  provider: JsonRpcProvider,
  account?: string
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(provider, account))
}

function getProviderOrSigner(provider: JsonRpcProvider, account?: string): Provider | Signer {
  return account ? provider.getSigner(account).connectUnchecked() : provider
}

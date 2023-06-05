import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { getProviderOrSigner } from './index';

// account is optional

export function getContract(address: string, ABI: any, provider: JsonRpcProvider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(address, ABI, getProviderOrSigner(provider, account) as any);
}

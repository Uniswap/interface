/* eslint-disable max-params */
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { Bytes, providers, Signer } from 'ethers'
import { SignsTypedData } from 'uniswap/src/features/transactions/signing'
import { HexString } from 'utilities/src/addresses/hex'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * A signer that uses a native keyring to access keys
 * NOTE: provide Keyring.platform.ts at runtime.
 */

export class NativeSigner extends Signer implements SignsTypedData {
  constructor(
    private readonly _address: string,
    _provider?: providers.Provider,
  ) {
    super()

    throw new PlatformSplitStubError('NativeSigner')
  }

  getAddress(): Promise<string> {
    throw new PlatformSplitStubError('getAddress')
  }

  signMessage(_message: string | Bytes): Promise<string> {
    throw new PlatformSplitStubError('signMessage')
  }

  // Doesn't include prefixed ethereum sign prefix, use sparingly
  signHashForAddress(_address: string, _hash: string | Bytes, _chainId: number): Promise<string> {
    throw new PlatformSplitStubError('signHashForAddress')
  }

  // reference: https://github.com/ethers-io/ethers.js/blob/ce8f1e4015c0f27bf178238770b1325136e3351a/packages/wallet/src.ts/index.ts#L135
  async _signTypedData(
    _domain: TypedDataDomain,
    _types: Record<string, Array<TypedDataField>>,
    _value: Record<string, unknown>,
  ): Promise<string> {
    throw new PlatformSplitStubError('_signTypedData')
  }

  async signTransaction(_transaction: providers.TransactionRequest): Promise<HexString> {
    throw new PlatformSplitStubError('signTransaction')
  }

  connect(_provider: providers.Provider): NativeSigner {
    throw new PlatformSplitStubError('connect')
  }
}

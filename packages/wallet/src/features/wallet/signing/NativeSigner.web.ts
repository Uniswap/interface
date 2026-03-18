/* eslint-disable max-params */
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { providers, Signer, UnsignedTransaction, utils } from 'ethers'
import { Bytes } from 'ethers/lib/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { SignsTypedData } from 'uniswap/src/features/transactions/signing'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { HexString, isValidHexString } from 'utilities/src/addresses/hex'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

/**
 * A signer that uses a native keyring to access keys
 * NOTE: provide Keyring.platform.ts at runtime.
 */

export class NativeSigner extends Signer implements SignsTypedData {
  constructor(
    private readonly address: string,
    provider?: providers.Provider,
  ) {
    super()

    if (provider && !providers.Provider.isProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`)
    }

    utils.defineReadOnly(this, 'provider', provider)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.address)
  }

  // TODO(WALL-6927): Fix typing for signMessage here for web
  signMessage(message: string): Promise<string> {
    return Keyring.signMessageForAddress(this.address, message)
  }

  signHashForAddress(address: string, hash: string | Bytes, chainId: number): Promise<string> {
    // Use type narrowing for safety
    if (typeof hash === 'string') {
      // Add 0x prefix if needed
      const prefixedHash = hash.startsWith('0x') ? hash : `0x${hash}`
      return Keyring.signHashForAddress(address, prefixedHash, chainId)
    } else {
      // Convert non-string (Bytes) to hex string
      return Keyring.signHashForAddress(address, utils.hexlify(hash), chainId)
    }
  }

  // reference: https://github.com/ethers-io/ethers.js/blob/ce8f1e4015c0f27bf178238770b1325136e3351a/packages/wallet/src.ts/index.ts#L135
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>,
  ): Promise<string> {
    const signature = await Keyring.signHashForAddress(
      this.address,
      _TypedDataEncoder.hash(domain, types, value),
      // TODO: WALL-4919: Remove hardcoded Mainnet
      toSupportedChainId(domain.chainId) || UniverseChainId.Mainnet,
    )
    return signature
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<HexString> {
    const tx = await utils.resolveProperties(transaction)

    if (tx.chainId === undefined) {
      throw new Error('Attempted to sign transaction with an undefined chain')
    }

    if (tx.from != null) {
      if (
        !areAddressesEqual({
          addressInput1: { address: tx.from, chainId: tx.chainId },
          addressInput2: { address: this.address, chainId: tx.chainId },
        })
      ) {
        throw new Error(`Signing address does not match the tx 'from' address`)
      }
      delete tx.from
    }

    const ut = <UnsignedTransaction>tx
    const hashedTx = utils.keccak256(utils.serializeTransaction(ut))
    const signature = await Keyring.signTransactionHashForAddress(
      this.address,
      hashedTx,
      // TODO: WALL-4919: Remove hardcoded Mainnet
      tx.chainId || UniverseChainId.Mainnet,
    )

    const signedTx = utils.serializeTransaction(ut, signature)
    if (!isValidHexString(signedTx)) {
      throw new Error('Invalid signed transaction')
    }

    return signedTx
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}

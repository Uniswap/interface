// From on https://github.com/Uniswap/wallet-internal/blob/main/apps/mobile/src/lib/RNEthersRs.ts
import { NativeModules } from 'react-native'
import { IKeyring } from './Keyring'

const { RNEthersRS } = NativeModules

/**
 * Simple wrapper around RNEthersRS
 */
class NativeKeyring implements IKeyring {
  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  getMnemonicIds(): Promise<string[]> {
    return RNEthersRS.getMnemonicIds()
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(mnemonic: string): Promise<string> {
    return RNEthersRS.importMnemonic(mnemonic)
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(): Promise<string> {
    return RNEthersRS.generateAndStoreMnemonic()
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    return RNEthersRS.getAddressesForStoredPrivateKeys()
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(
    mnemonicId: string,
    derivationIndex: number
  ): Promise<string> {
    return RNEthersRS.generateAndStorePrivateKey(mnemonicId, derivationIndex)
  }

  signTransactionHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string> {
    return RNEthersRS.signTransactionHashForAddress(address, hash, chainId)
  }

  signMessageForAddress(address: string, message: string): Promise<string> {
    return RNEthersRS.signMessageForAddress(address, message)
  }

  signHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string> {
    return RNEthersRS.signHashForAddress(address, hash, chainId)
  }
}

export const Keyring = new NativeKeyring()

declare module 'react-native' {
  interface NativeModulesStatic {
    RNEthersRS: IKeyring
  }
}

import { NativeModules } from 'react-native'
import { NotImplementedError } from 'utilities/src/errors'
import { IKeyring } from './Keyring'

const { RNEthersRS } = NativeModules

/**
 * Simple wrapper around RNEthersRS
 */
class NativeKeyring implements IKeyring {
  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  lock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  getMnemonicIds(): Promise<string[]> {
    return RNEthersRS.getMnemonicIds()
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(mnemonic: string): Promise<string> {
    return RNEthersRS.importMnemonic(mnemonic)
  }

  // Not used on mobile
  retrieveMnemonicUnlocked(_address: string): Promise<string | undefined> {
    throw new NotImplementedError('retrieveMnemonic')
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(): Promise<string> {
    return RNEthersRS.generateAndStoreMnemonic()
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    return RNEthersRS.getAddressesForStoredPrivateKeys()
  }

  // returns the address for a given mnemonic
  generateAddressForMnemonic(mnemonic: string, derivationIndex: number): Promise<string> {
    return RNEthersRS.generateAddressForMnemonic(mnemonic, derivationIndex)
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(mnemonicId: string, derivationIndex: number): Promise<string> {
    return RNEthersRS.generateAndStorePrivateKey(mnemonicId, derivationIndex)
  }

  signTransactionHashForAddress(address: string, hash: string, chainId: number): Promise<string> {
    return RNEthersRS.signTransactionHashForAddress(address, hash, chainId)
  }

  signMessageForAddress(address: string, message: string): Promise<string> {
    return RNEthersRS.signMessageForAddress(address, message)
  }

  signHashForAddress(address: string, hash: string, chainId: number): Promise<string> {
    return RNEthersRS.signHashForAddress(address, hash, chainId)
  }
}

export const Keyring = new NativeKeyring()

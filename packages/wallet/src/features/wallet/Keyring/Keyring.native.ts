/* eslint-disable max-params */
declare module 'react-native' {
  interface NativeModulesStatic {
    RNEthersRS: IKeyring
    EmbeddedWallet: {
      generateKeyPair: () => Promise<string>
      decryptMnemonicForPublicKey: (encryptedMnemonic: string, publicKeyBase64: string) => Promise<string>
    }
  }
}

import { NativeModules } from 'react-native'
import { NotImplementedError } from 'utilities/src/errors'
import { IKeyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const { RNEthersRS, EmbeddedWallet } = NativeModules

/**
 * Simple wrapper around RNEthersRS
 */
class NativeKeyring implements IKeyring {
  removeAllMnemonicsAndPrivateKeys(): Promise<boolean> {
    throw new NotImplementedError('removeAllMnemonicsAndPrivateKeys')
  }

  isUnlocked(): Promise<boolean> {
    throw new NotImplementedError('isUnlocked')
  }

  removeMnemonic(mnemonicId: string): Promise<boolean> {
    return RNEthersRS.removeMnemonic(mnemonicId)
  }

  removePrivateKey(address: string): Promise<boolean> {
    return RNEthersRS.removePrivateKey(address)
  }

  removePassword(): Promise<boolean> {
    // n/a on mobile
    throw new NotImplementedError('removePassword')
  }

  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  lock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  // Not used on mobile
  checkPassword(_password: string): Promise<boolean> {
    throw new NotImplementedError('checkPassword')
  }

  // Not used on mobile
  changePassword(_newPassword: string): Promise<boolean> {
    throw new NotImplementedError('changePassword')
  }

  getMnemonicIds(): Promise<string[]> {
    return RNEthersRS.getMnemonicIds()
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(mnemonic: string): Promise<string> {
    return RNEthersRS.importMnemonic(mnemonic)
  }

  // Not used on mobile
  retrieveMnemonicUnlocked(_address: string): Promise<string> {
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

  generateAddressesForMnemonic(_mnemonicId: string, _startIndex: number, _stopIndex: number): Promise<string[]> {
    throw new NotImplementedError('generateAddressesForMnemonic')
  }

  generateAddressesForMnemonicId(_mnemonicId: string, _startIndex: number, _stopIndex: number): Promise<string[]> {
    throw new NotImplementedError('generateAddressesForMnemonicId')
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

  generateKeyPairForPasskeyWallet(): Promise<string> {
    return EmbeddedWallet.generateKeyPair()
  }

  decryptMnemonicForPasskey(encryptedMnemonic: string, publicKeyBase64: string): Promise<string> {
    return EmbeddedWallet.decryptMnemonicForPublicKey(encryptedMnemonic, publicKeyBase64)
  }
}

export const Keyring = new NativeKeyring()

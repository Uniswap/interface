declare module 'react-native' {
  interface NativeModulesStatic {
    RNEthersRS: IKeyring
  }
}

import { NativeModules } from 'react-native'
import { IKeyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const { RNEthersRS } = NativeModules

export function getMnemonicIds(): Promise<string[]> {
  return RNEthersRS.getMnemonicIds()
}

// returns the mnemonicId (derived address at index 0) of the imported mnemonic
export function importMnemonic(mnemonic: string): Promise<string> {
  return RNEthersRS.importMnemonic(mnemonic)
}

// returns the mnemonicId (derived address at index 0) of the stored mnemonic
export function generateAndStoreMnemonic(): Promise<string> {
  return RNEthersRS.generateAndStoreMnemonic()
}

export function getAddressesForStoredPrivateKeys(): Promise<string[]> {
  return RNEthersRS.getAddressesForStoredPrivateKeys()
}

// returns the address for the mnemonic
export function generateAddressForMnemonic(
  mnemonic: string,
  derivationIndex: number
): Promise<string> {
  return RNEthersRS.generateAddressForMnemonic(mnemonic, derivationIndex)
}

// returns the address of the generated key
export function generateAndStorePrivateKey(
  mnemonicId: string,
  derivationIndex: number
): Promise<string> {
  return RNEthersRS.generateAndStorePrivateKey(mnemonicId, derivationIndex)
}

export function signTransactionHashForAddress(
  address: string,
  hash: string,
  chainId: number
): Promise<string> {
  return RNEthersRS.signTransactionHashForAddress(address, hash, chainId)
}

export function signMessageForAddress(address: string, message: string): Promise<string> {
  return RNEthersRS.signMessageForAddress(address, message)
}

export function signHashForAddress(
  address: string,
  hash: string,
  chainId: number
): Promise<string> {
  return RNEthersRS.signHashForAddress(address, hash, chainId)
}

import { Transaction } from 'ethers'
import { NativeModules } from 'react-native'

const { RNEthersRS } = NativeModules

export function getMnemonicIds(): Promise<string[]> {
  return RNEthersRS.getMnemonicIds()
}

// returns the mnemonicId (sha256 hash) of the imported mnemonic
export function importMnemonic(mnemonic: string, address: string): Promise<string> {
  return RNEthersRS.importMnemonic(mnemonic, address)
}

// returns the mnemonicId (sha256 hash) of the stored mnemonic
export function generateAndStoreMnemonic(): Promise<string> {
  return RNEthersRS.generateAndStoreMnemonic()
}

export function getAddressesForStoredPrivateKeys(): Promise<string[]> {
  return RNEthersRS.getAddressesForStoredPrivateKeys()
}

// returns the address of the generated key
export function generateAndStorePrivateKey(
  mnemonicId: string,
  derivationIndex: number
): Promise<string> {
  return RNEthersRS.getAddressesForStoredPrivateKeys(mnemonicId, derivationIndex)
}

export function signTransactionForAddress(
  address: string,
  transaction: Transaction
): Promise<string> {
  return RNEthersRS.signTransactionForAddress(address, JSON.stringify(transaction))
}

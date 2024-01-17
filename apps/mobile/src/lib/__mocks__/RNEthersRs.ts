import { providers, utils, Wallet } from 'ethers'

const pathFromIndex = (index: number): string => `m/44'/60'/0'/0/${index}`

const mnemonics: { [id: string]: string } = {}
const privateKeys: { [id: string]: string } = {}

export function getMnemonicIds(): Promise<string[]> {
  return Promise.resolve(Object.keys(mnemonics))
}

// returns the mnemonicId (derived address at index 0) of the imported mnemonic
export function importMnemonic(mnemonic: string): Promise<string> {
  const wallet = Wallet.fromMnemonic(mnemonic)
  mnemonics[wallet.address] = mnemonic
  return Promise.resolve(wallet.address)
}

// returns the mnemonicId (derived address at index 0) of the stored mnemonic
export function generateAndStoreMnemonic(): Promise<string> {
  const wallet = Wallet.createRandom()
  mnemonics[wallet.address] = wallet.mnemonic.phrase
  return Promise.resolve(wallet.address)
}

export function getAddressesForStoredPrivateKeys(): Promise<string[]> {
  return Promise.resolve(Object.keys(privateKeys))
}

// returns the address for the mnemonic
export function generateAddressForMnemonic(
  mnemonic: string,
  derivationIndex: number
): Promise<string> {
  const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(derivationIndex))
  return Promise.resolve(wallet.address)
}

// returns the address of the generated key
export function generateAndStorePrivateKey(
  mnemonicId: string,
  derivationIndex: number
): Promise<string> {
  const mnemonic = mnemonics[mnemonicId]
  if (!mnemonic) {
    return Promise.reject(`No mnemonic found for ${mnemonicId}`)
  }
  const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(derivationIndex))
  privateKeys[wallet.address] = wallet.privateKey
  return Promise.resolve(wallet.address)
}

export async function signTransactionForAddress(
  address: string,
  transaction: providers.TransactionRequest
): Promise<string> {
  const privateKey = privateKeys[address]
  if (!privateKey) {
    return Promise.reject(`No private key found for ${address}`)
  }
  const wallet = new Wallet(privateKey)
  const signature = await wallet.signTransaction(transaction)
  return signature
}

export async function signMessageForAddress(
  address: string,
  message: string | utils.Bytes
): Promise<string> {
  const privateKey = privateKeys[address]
  if (!privateKey) {
    return Promise.reject(`No private key found for ${address}`)
  }
  const wallet = new Wallet(privateKey)
  const signature = await wallet.signMessage(message)
  return signature
}

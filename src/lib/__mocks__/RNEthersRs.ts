import { providers, utils, Wallet } from 'ethers'

const pathFromIndex = (index: number) => `m/44'/60'/0'/0/${index}`

let mnemonics: { [id: string]: string } = {}
let privateKeys: { [id: string]: string } = {}

export function getMnemonicIds() {
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

// returns the address of the generated key
export function generateAndStorePrivateKey(
  mnemonicId: string,
  derivationIndex: number
): Promise<string> {
  const wallet = Wallet.fromMnemonic(mnemonics[mnemonicId], pathFromIndex(derivationIndex))
  privateKeys[wallet.address] = wallet.privateKey
  return Promise.resolve(wallet.address)
}

export async function signTransactionForAddress(
  address: string,
  transaction: providers.TransactionRequest
): Promise<string> {
  const wallet = new Wallet(privateKeys[address])
  const signature = await wallet.signTransaction(transaction)
  return signature
}

export async function signMessageForAddress(
  address: string,
  message: string | utils.Bytes
): Promise<string> {
  const wallet = new Wallet(privateKeys[address])
  const signature = await wallet.signMessage(message)
  return signature
}

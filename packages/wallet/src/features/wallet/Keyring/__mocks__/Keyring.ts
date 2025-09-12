/* eslint-disable max-params */
import { faker } from '@faker-js/faker'
import { providers, utils, Wallet } from 'ethers'
import { IKeyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const pathFromIndex = (index: number): string => `m/44'/60'/0'/0/${index}`

const mnemonics: { [id: string]: string } = {}
const privateKeys: { [id: string]: string } = {}

const password = faker.word.noun()

class MockKeyring implements IKeyring {
  removeAllMnemonicsAndPrivateKeys(): Promise<boolean> {
    return Promise.resolve(false)
  }

  isUnlocked(): Promise<boolean> {
    return Promise.resolve(false)
  }

  unlock(p: string): Promise<boolean> {
    return Promise.resolve(password === p)
  }

  lock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  checkPassword(_password: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  changePassword(_newPassword: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  removePassword(): Promise<boolean> {
    return Promise.resolve(true)
  }

  getMnemonicIds(): Promise<string[]> {
    return Promise.resolve(Object.keys(mnemonics))
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(mnemonic: string): Promise<string> {
    const wallet = Wallet.fromMnemonic(mnemonic)
    mnemonics[wallet.address] = mnemonic
    return Promise.resolve(wallet.address)
  }

  removeMnemonic(mnemonicId: string): Promise<boolean> {
    delete mnemonics[mnemonicId]
    return Promise.resolve(true)
  }

  retrieveMnemonicUnlocked(address: string): Promise<string | undefined> {
    return Promise.resolve(mnemonics[address])
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(): Promise<string> {
    const wallet = Wallet.createRandom()
    mnemonics[wallet.address] = wallet.mnemonic.phrase
    return Promise.resolve(wallet.address)
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    return Promise.resolve(Object.keys(privateKeys))
  }

  // returns the address for a given mnemonic
  generateAddressForMnemonic(mnemonic: string, derivationIndex: number): Promise<string> {
    const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(derivationIndex))
    return Promise.resolve(wallet.address)
  }

  generateAddressesForMnemonic(
    mnemonic: string,
    startDerivationIndex: number,
    endDerivationIndex: number,
  ): Promise<Array<string>> {
    const addresses = []
    for (let i = startDerivationIndex; i <= endDerivationIndex; i++) {
      const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(i))
      addresses.push(wallet.address)
    }
    return Promise.resolve(addresses)
  }

  generateAddressesForMnemonicId(
    mnemonicId: string,
    startDerivationIndex: number,
    endDerivationIndex: number,
  ): Promise<Array<string>> {
    const mnemonic = mnemonics[mnemonicId]
    if (!mnemonic) {
      return Promise.reject(new Error(`No mnemonic found for ${mnemonicId}`))
    }
    const addresses = []
    for (let i = startDerivationIndex; i <= endDerivationIndex; i++) {
      const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(i))
      addresses.push(wallet.address)
    }
    return Promise.resolve(addresses)
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(mnemonicId: string, derivationIndex: number): Promise<string> {
    const mnemonic = mnemonics[mnemonicId]
    if (!mnemonic) {
      return Promise.reject(`No mnemonic found for ${mnemonicId}`)
    }
    const wallet = Wallet.fromMnemonic(mnemonic, pathFromIndex(derivationIndex))
    privateKeys[wallet.address] = wallet.privateKey
    return Promise.resolve(wallet.address)
  }

  removePrivateKey(address: string): Promise<boolean> {
    delete privateKeys[address]
    return Promise.resolve(true)
  }

  async signTransactionForAddress(address: string, transaction: providers.TransactionRequest): Promise<string> {
    const privateKey = privateKeys[address]
    if (!privateKey) {
      return Promise.reject(`No private key found for ${address}`)
    }
    const wallet = new Wallet(privateKey)
    const signature = await wallet.signTransaction(transaction)
    return signature
  }

  async signMessageForAddress(address: string, message: string | utils.Bytes): Promise<string> {
    const privateKey = privateKeys[address]
    if (!privateKey) {
      return Promise.reject(`No private key found for ${address}`)
    }
    const wallet = new Wallet(privateKey)
    const signature = await wallet.signMessage(message)
    return signature
  }

  async signTransactionHashForAddress(): Promise<string> {
    throw new Error('Not implemented')
  }

  async signHashForAddress(): Promise<string> {
    throw new Error('Not implemented')
  }

  generateKeyPairForPasskeyWallet(): Promise<string> {
    throw new Error('Not implemented')
  }

  decryptMnemonicForPasskey(_encryptedMnemonic: string, _publicKeyBase64: string): Promise<string> {
    throw new Error('Not implemented')
  }
}

export const Keyring = new MockKeyring()

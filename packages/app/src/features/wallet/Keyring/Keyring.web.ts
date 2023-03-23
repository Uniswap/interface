import { Wallet } from 'ethers'
import { defaultPath } from 'ethers/lib/utils'
import { logger } from '../../logger/logger'
import { IKeyring } from './Keyring'

const prefix = 'com.uniswap.web'
const mnemonicPrefix = '.mnemonic.'
const privateKeyPrefix = '.privateKey.'
const entireMnemonicPrefix = prefix + mnemonicPrefix
const entirePrivateKeyPrefix = prefix + privateKeyPrefix

enum ErrorType {
  StoreMnemonicError = 'storeMnemonicError',
  RetrieveMnemonicError = 'retrieveMnemonicError',
}

/**
 * Provides the generation, storage, and signing logic for mnemonics and private keys on web.
 *
 * Mnemonics and private keys are stored and accessed in secure local key-value store via associated keys formed from concatenating a constant prefix with the associated public address.
 *
 * @link https://github.com/Uniswap/mobile/blob/main/ios/RNEthersRS.swift
 */
export class WebKeyring implements IKeyring {
  constructor(
    private store: chrome.storage.StorageArea = chrome.storage.local
  ) {
    this.generateAndStoreMnemonic = this.generateAndStoreMnemonic.bind(this)
    this.generateAndStorePrivateKey = this.generateAndStorePrivateKey.bind(this)
    this.importMnemonic = this.importMnemonic.bind(this)
    this.keyForMnemonicId = this.keyForMnemonicId.bind(this)
    this.keyForPrivateKey = this.keyForPrivateKey.bind(this)
    this.retrieveMnemonic = this.retrieveMnemonic.bind(this)
    this.storeNewMnemonic = this.storeNewMnemonic.bind(this)
  }

  /**
   * Fetches all mnemonic IDs, which are used as keys to access the actual mnemonics
   * in key-value store.
   * @param mnemonic
   * @returns array of mnemonic IDs
   */
  async getMnemonicIds(): Promise<string[]> {
    const allKeys = Object.keys(await this.store.get(null))

    const mnemonicIds = allKeys
      .filter((k) => k.includes(mnemonicPrefix))
      .map((k) => k.replaceAll(entireMnemonicPrefix, ''))

    return mnemonicIds
  }

  /**
   * Derives private key from mnemonic with derivation index 0 and retrieves
   * associated public address. Stores imported mnemonic in store with the
   * mnemonic ID key as the public address.
   
   * @param mnemonic The mnemonic phrase to import
   * @returns public address from the mnemonic's first derived private key
   */
  async importMnemonic(mnemonic: string): Promise<string> {
    const wallet = Wallet.fromMnemonic(mnemonic)

    const address = wallet.address

    if (!(await this.storeNewMnemonic(mnemonic, address))) {
      throw new Error('Failed to import mnemonic')
    }

    return address
  }

  /**
   Generates a new mnemonic and retrieves associated public address. Stores new mnemonic in native keychain with the mnemonic ID key as the public address.
   
   @returns public address from the mnemonic's first derived private key
   */
  async generateAndStoreMnemonic(): Promise<string> {
    const newWallet = Wallet.createRandom()

    const mnemonic = newWallet.mnemonic.phrase
    const address = newWallet.address

    if (!(await this.storeNewMnemonic(mnemonic, address))) {
      throw new Error('Failed to generate and store mnemonic')
    }

    return address
  }

  // TODO: encrypt
  private async storeNewMnemonic(
    mnemonic: string,
    address: string
  ): Promise<string | undefined> {
    const newMnemonicKey = this.keyForMnemonicId(address)
    const checkStored = await this.retrieveMnemonic(newMnemonicKey)

    if (checkStored === undefined) {
      this.store.set({ [newMnemonicKey]: mnemonic })
      return address
    }

    logger.debug(
      'Keyring.web',
      'storeNewMnemonic',
      'mnemonic already stored. Did you mean to reimport?'
    )
    return undefined
  }

  private keyForMnemonicId(mnemonicId: string): string {
    return mnemonicPrefix + mnemonicId
  }

  private async retrieveMnemonic(
    mnemonicId: string
  ): Promise<string | undefined> {
    const key = this.keyForMnemonicId(mnemonicId)
    return (await this.store.get(key))[key]
  }

  /**
   * Fetches all public addresses from private keys stored under `privateKeyPrefix` in store.
   * Used from to verify the store has the private key for an account that is attempting create a NativeSigner that calls signing methods
   * @returns public addresses for all stored private keys
   */
  async getAddressesForStoredPrivateKeys(): Promise<string[]> {
    const addresses = Object.keys(await this.store.get(null))
      .filter((k) => k.includes(privateKeyPrefix))
      .map((k) => k.replaceAll(entirePrivateKeyPrefix, ''))

    return addresses
  }

  /**
   * Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`. Stores the private key in store with key.
   @param mnemonicId key string associated with mnemonic to generate private key for (currently convention is to use public address associated with mnemonic)
   @param derivationIndex number used to specify a which derivation index to use for deriving a private key from the mnemonic
   @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  async generateAndStorePrivateKey(
    mnemonicId: string,
    derivationIndex: number
  ): Promise<string> {
    const mnemonic = await this.retrieveMnemonic(mnemonicId)

    if (!mnemonic) {
      throw new Error(ErrorType.RetrieveMnemonicError)
    }

    const derivationPath = defaultPath + derivationIndex
    const walletAtIndex = Wallet.fromMnemonic(mnemonic, derivationPath)

    const privateKey = walletAtIndex.privateKey
    const address = walletAtIndex.address

    await this.storeNewPrivateKey(address, privateKey)

    return walletAtIndex.address
  }

  private storeNewPrivateKey(
    address: string,
    privateKey: string
  ): Promise<void> {
    try {
      const newKey = this.keyForPrivateKey(address)
      return this.store.set({ [newKey]: privateKey })
    } catch (e) {
      throw new Error(ErrorType.StoreMnemonicError + `: ${e}`)
    }
  }

  private async retrievePrivateKey(
    address: string
  ): Promise<string | undefined> {
    const key = this.keyForPrivateKey(address)
    return (await this.store.get(key))[key]
  }
  private keyForPrivateKey(address: string): string {
    return privateKeyPrefix + address
  }

  signTransactionHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string> {
    // return RNEthersRS.signTransactionHashForAddress(address, hash, chainId)
    return Promise.resolve('')
  }

  signMessageForAddress(address: string, message: string): Promise<string> {
    // return RNEthersRS.signMessageForAddress(address, message)
    return Promise.resolve('')
  }

  signHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string> {
    // return RNEthersRS.signHashForAddress(address, hash, chainId)
    return Promise.resolve('')
  }
}

export const Keyring = new WebKeyring()

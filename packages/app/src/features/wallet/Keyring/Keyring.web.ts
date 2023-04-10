import { PersistedStorage } from 'app/src/utils/persistedStorage'
import { Signature, Wallet } from 'ethers'
import { SigningKey, defaultPath, joinSignature } from 'ethers/lib/utils'
import { logger } from '../../logger/logger'
import { IKeyring } from './Keyring'
import { decrypt, encrypt } from './crypto'

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
  private _password: string | null = null

  constructor(private storage = new PersistedStorage()) {
    this.generateAndStoreMnemonic = this.generateAndStoreMnemonic.bind(this)
    this.generateAndStorePrivateKey = this.generateAndStorePrivateKey.bind(this)
    this.getMnemonicIds = this.getMnemonicIds.bind(this)
    this.importMnemonic = this.importMnemonic.bind(this)
    this.keyForMnemonicId = this.keyForMnemonicId.bind(this)
    this.keyForPrivateKey = this.keyForPrivateKey.bind(this)
    this.retrieveMnemonic = this.retrieveMnemonic.bind(this)
    this.storeNewMnemonic = this.storeNewMnemonic.bind(this)
    this.unlock = this.unlock.bind(this)
  }

  /**
   * Fetches all mnemonic IDs, which are used as keys to access the actual mnemonics
   * in key-value store.
   * @param mnemonic
   * @returns array of mnemonic IDs
   */
  async getMnemonicIds(): Promise<string[]> {
    const allKeys = Object.keys(await this.storage.getAll())

    const mnemonicIds = allKeys
      .filter((k) => k.includes(mnemonicPrefix))
      .map((k) => k.replaceAll(entireMnemonicPrefix, ''))

    return mnemonicIds
  }

  async unlock(password: string): Promise<boolean> {
    // assumes every mnemonic is encrypted withe same password
    const firstMnemonicId = (await this.getMnemonicIds())[0]

    if (!firstMnemonicId) {
      throw new Error(
        `${ErrorType.RetrieveMnemonicError}: Attempted to unlock wallet, but storage is empty.`
      )
    }

    const mnemonic = await this.retrieveMnemonic(firstMnemonicId, password)
    if (!mnemonic) {
      return false
    }

    this.password = password

    return true
  }

  /**
   * Derives private key from mnemonic with derivation index 0 and retrieves
   * associated public address. Stores imported mnemonic in store with the
   * mnemonic ID key as the public address.

   * @param mnemonic the mnemonic phrase to import
   * @param password the password to encrypt the mnemonic. Marked as optional depending on the platform.
*                    Currently only used on web.
   * @returns public address from the mnemonic's first derived private key
   */
  async importMnemonic(mnemonic: string, password: string): Promise<string> {
    const wallet = Wallet.fromMnemonic(mnemonic)

    const address = wallet.address

    const mnemonicId = await this.storeNewMnemonic(mnemonic, password, address)
    if (!mnemonicId) {
      throw new Error(
        `${ErrorType.StoreMnemonicError}: Failed to import mnemonic`
      )
    }

    this.password = password

    return mnemonicId
  }

  /**
   * Generates a new mnemonic and retrieves associated public address. Stores new mnemonic in native keychain with the mnemonic ID key as the public address.
   * @param password the password to encrypt the mnemonic
   * @returns public address from the mnemonic's first derived private key
   */
  async generateAndStoreMnemonic(password: string): Promise<string> {
    const newWallet = Wallet.createRandom()

    const mnemonic = newWallet.mnemonic.phrase
    const address = newWallet.address

    if (!(await this.storeNewMnemonic(mnemonic, password, address))) {
      throw new Error(
        `${ErrorType.StoreMnemonicError}: Failed to generate and store mnemonic`
      )
    }

    this.password = password

    return address
  }

  private async storeNewMnemonic(
    mnemonic: string,
    password: string,
    address: string
  ): Promise<string | undefined> {
    const checkStored = await this.retrieveMnemonic(address, password)

    if (checkStored !== undefined) {
      logger.debug(
        'Keyring.web',
        'storeNewMnemonic',
        'mnemonic already stored. Did you mean to reimport?'
      )

      return address
    }

    const secretPayload = await encrypt(mnemonic, password)

    const newMnemonicKey = this.keyForMnemonicId(address)
    await this.storage.setItem(newMnemonicKey, JSON.stringify(secretPayload))

    return address
  }

  private keyForMnemonicId(mnemonicId: string): string {
    // NOTE: small difference with mobile implementation--native keychain prepends a custom prefix, but we missed do it ourselves here.
    return entireMnemonicPrefix + mnemonicId
  }

  private async retrieveMnemonic(
    mnemonicId: string,
    password: string
  ): Promise<string | undefined> {
    const key = this.keyForMnemonicId(mnemonicId)
    const result = await this.storage.getItem(key)

    if (!result) return undefined

    try {
      const maybeSecretPayload = JSON.parse(result)
      const mnemonic = await decrypt(password, maybeSecretPayload)

      if (!mnemonic) return undefined

      // validate mnemonic (will throw if invalid)
      Wallet.fromMnemonic(mnemonic)

      return mnemonic
    } catch (e) {
      throw new Error(`${ErrorType.RetrieveMnemonicError}: ${e}`)
    }
  }

  /**
   * Fetches all public addresses from private keys stored under `privateKeyPrefix` in store.
   * Used from to verify the store has the private key for an account that is attempting create a NativeSigner that calls signing methods
   * @returns public addresses for all stored private keys
   */
  async getAddressesForStoredPrivateKeys(): Promise<string[]> {
    const addresses = Object.keys(await this.storage.getAll())
      .filter((k) => k.includes(privateKeyPrefix))
      .map((k) => k.replaceAll(entirePrivateKeyPrefix, ''))

    return addresses
  }

  /**
   * Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`. Stores the private key in store with key.
   * @param mnemonicId key string associated with mnemonic to generate private key for (currently convention is to use public address associated with mnemonic)
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key from the mnemonic
   * @param password the password to decrypt the private key
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  async generateAndStorePrivateKey(
    mnemonicId: string,
    derivationIndex: number
  ): Promise<string> {
    const mnemonic = await this.retrieveMnemonic(mnemonicId, this.password)

    if (!mnemonic) {
      throw new Error(ErrorType.RetrieveMnemonicError)
    }

    const derivationPath = defaultPath + derivationIndex
    const walletAtIndex = Wallet.fromMnemonic(mnemonic, derivationPath)

    const privateKey = walletAtIndex.privateKey
    const address = walletAtIndex.address

    return await this.storeNewPrivateKey(address, privateKey)
  }

  /** @returns address is store call was successfull. */
  private async storeNewPrivateKey(
    address: string,
    privateKey: string
  ): Promise<string> {
    const checkStored = await this.retrievePrivateKey(address)

    if (checkStored !== undefined) {
      logger.debug(
        'Keyring.web',
        'storeNewPrivateKey',
        'privateKey already stored. Did you mean to reimport?'
      )

      return address
    }

    try {
      const secretPayload = await encrypt(privateKey, this.password)

      const newKey = this.keyForPrivateKey(address)
      await this.storage.setItem(newKey, JSON.stringify(secretPayload))

      return address
    } catch (e) {
      throw new Error(ErrorType.StoreMnemonicError + `: ${e}`)
    }
  }

  private async retrievePrivateKey(
    address: string
  ): Promise<string | undefined> {
    const key = this.keyForPrivateKey(address)
    const result = await this.storage.getItem(key)

    if (!result) return undefined

    try {
      const maybeSecretPayload = JSON.parse(result)
      const privateKey = await decrypt(this.password, maybeSecretPayload)

      if (!privateKey) return undefined

      // validate private key (will throw if invalid)
      const wallet = new Wallet(privateKey)
      if (!wallet) {
        throw new Error('Invalid private key')
      }

      return privateKey
    } catch (e) {
      throw new Error(`${ErrorType.RetrieveMnemonicError}: ${e}`)
    }
  }

  private keyForPrivateKey(address: string): string {
    return entirePrivateKeyPrefix + address
  }

  /**
   * @returns the Signature of the signed transaction in string form.
   **/
  signTransactionHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string> {
    // Ethers.js doesn't differentiate between signing a random hash and signing a transaction hash
    return this.signHashForAddress(address, hash, chainId)
  }

  signMessageForAddress(address: string, message: string): Promise<string> {
    const privateKey = this.retrievePrivateKey(address)
    return privateKey.then((key) => {
      if (!key) throw Error('No private key found for address')
      const wallet = new Wallet(key)
      return wallet.signMessage(message)
    })
  }

  /**
   * @returns the Signature of the signed hash in string form.
   **/
  signHashForAddress(
    address: string,
    hash: string,
    _chainId: number
  ): Promise<string> {
    const privateKey = this.retrievePrivateKey(address)
    return privateKey.then((key) => {
      if (!key) throw Error('No private key found for address')
      const signingKey = new SigningKey(key)
      const signature: Signature = signingKey.signDigest(hash)
      return joinSignature(signature)
    })
  }

  private get password(): string {
    if (!this._password) {
      throw new Error('Password is missing')
    }

    return this._password
  }

  private set password(password: string) {
    if (this._password) {
      logger.warn(
        'Keyring.web',
        'setPassword',
        'Attempted to set password again'
      )
    }

    this._password = password
  }
}

export const Keyring = new WebKeyring()

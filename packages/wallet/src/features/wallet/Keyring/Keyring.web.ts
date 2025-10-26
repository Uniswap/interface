/* eslint-disable max-params */
/* eslint-disable max-lines */
import { HDKey } from '@scure/bip32'
import { Buffer } from 'buffer'
import { Signature, utils, Wallet } from 'ethers'
import { defaultPath, joinSignature, SigningKey } from 'ethers/lib/utils'
import { logger } from 'utilities/src/logger/logger'
import {
  addEncryptedCiphertextToSecretPayload,
  convertBase64SeedToCryptoKey,
  createEmptySecretPayload,
  decodeFromStorage,
  decrypt,
  exportKey,
  getEncryptionKeyFromPassword,
  SecretPayload,
} from 'wallet/src/features/wallet/Keyring/crypto'
import { IKeyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { ENCRYPTION_KEY_STORAGE_KEY, PersistedStorage, prefix } from 'wallet/src/utils/persistedStorage'

const mnemonicPrefix = '.mnemonic.'
const privateKeyPrefix = '.privateKey.'
const entireMnemonicPrefix = prefix + mnemonicPrefix
const entirePrivateKeyPrefix = prefix + privateKeyPrefix

enum ErrorType {
  StoreMnemonicError = 'storeMnemonicError',
  RetrieveMnemonicError = 'retrieveMnemonicError',
  RetrievePasswordError = 'retrievePasswordError',
}

/**
 * Provides the generation, storage, and signing logic for mnemonics and private keys on web.
 *
 * Mnemonics and private keys are stored and accessed in secure local key-value store via associated keys formed from concatenating a constant prefix with the associated public address.
 *
 * @link https://github.com/Uniswap/universe/blob/main/apps/mobile/ios/RNEthersRS.swift
 */
export class WebKeyring implements IKeyring {
  private keysMap: Map<string, CryptoKeyPair>

  constructor(
    private storage = new PersistedStorage('local'),
    private session = new PersistedStorage('session'),
  ) {
    this.generateAndStoreMnemonic = this.generateAndStoreMnemonic.bind(this)
    this.generateAddressForMnemonic = this.generateAddressForMnemonic.bind(this)
    this.generateAddressesForMnemonic = this.generateAddressesForMnemonic.bind(this)
    this.generateAddressesForMnemonicId = this.generateAddressesForMnemonicId.bind(this)
    this.generateAndStorePrivateKey = this.generateAndStorePrivateKey.bind(this)
    this.getMnemonicIds = this.getMnemonicIds.bind(this)
    this.importMnemonic = this.importMnemonic.bind(this)
    this.keyForMnemonicId = this.keyForMnemonicId.bind(this)
    this.keyForPrivateKey = this.keyForPrivateKey.bind(this)
    this.retrieveMnemonic = this.retrieveMnemonic.bind(this)
    this.retrieveMnemonicUnlocked = this.retrieveMnemonicUnlocked.bind(this)
    this.storeNewMnemonic = this.storeNewMnemonic.bind(this)
    this.unlock = this.unlock.bind(this)
    this.lock = this.lock.bind(this)
    this.keysMap = new Map()
  }

  async generateKeyPairForPasskeyWallet(): Promise<string> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt'],
    )
    // Export the public key in 'spki' format to match BE expectations
    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const publicKeyBase64 = Buffer.from(publicKeySpki).toString('base64')
    this.keysMap.set(publicKeyBase64, keyPair)
    return publicKeyBase64
  }

  async decryptMnemonicForPasskey(encryptedMnemonic: string, publicKeyBase64: string): Promise<string> {
    const keyPair = this.keysMap.get(publicKeyBase64)
    if (!keyPair) {
      throw new Error('No key pair found')
    }
    const decryptedMnemonic = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      keyPair.privateKey,
      Buffer.from(encryptedMnemonic, 'base64'),
    )
    return new TextDecoder().decode(decryptedMnemonic)
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

  async removeAllMnemonicsAndPrivateKeys(): Promise<boolean> {
    const allKeys = Object.keys(await this.storage.getAll())

    const mnemonicStorageKeys = allKeys.filter((k) => k.includes(mnemonicPrefix))
    const privateKeyStorageKeys = allKeys.filter((k) => k.includes(privateKeyPrefix))

    await this.storage.removeItem(mnemonicStorageKeys)
    await this.storage.removeItem(privateKeyStorageKeys)

    return true
  }

  async isUnlocked(): Promise<boolean> {
    const firstMnemonicId = (await this.getMnemonicIds())[0]

    if (!firstMnemonicId) {
      return false
    }

    try {
      const mnemonic = await this.retrieveMnemonicUnlocked(firstMnemonicId)
      return !!mnemonic
    } catch {
      return false
    }
  }

  /** Tries to unlock the wallet with the provided password.  */
  async unlock(password: string): Promise<boolean> {
    try {
      // assumes every mnemonic is encrypted withe same password
      const firstMnemonicId = (await this.getMnemonicIds())[0]

      if (!firstMnemonicId) {
        throw new Error(`${ErrorType.RetrieveMnemonicError}: Attempted to unlock wallet, but storage is empty.`)
      }

      const mnemonicKey = this.keyForMnemonicId(firstMnemonicId)
      const storedSecretPayload = await this.storage.getItem(mnemonicKey)
      if (!storedSecretPayload) {
        throw new Error('No stored secret payload found')
      }

      const secretPayload = JSON.parse(storedSecretPayload) as Maybe<SecretPayload>
      if (!secretPayload) {
        throw new Error('Could not parse secret payload')
      }

      const encryptionKey = await getEncryptionKeyFromPassword({ password, secretPayload })
      await this.retrieveMnemonic(secretPayload, encryptionKey, firstMnemonicId)
      const keyBase64 = await exportKey(encryptionKey)
      await this.session.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyBase64)
      return true
    } catch {
      return false
    }
  }

  async lock(): Promise<boolean> {
    await this.session.removeItem(ENCRYPTION_KEY_STORAGE_KEY) // Clear password
    return true
  }

  async checkPassword(password: string): Promise<boolean> {
    try {
      const currentPasswordBase64String = await this.session.getItem(ENCRYPTION_KEY_STORAGE_KEY)
      const firstMnemonicId = (await this.getMnemonicIds())[0]
      if (!firstMnemonicId) {
        return false
      }
      const keyForMnemonicId = this.keyForMnemonicId(firstMnemonicId)
      const storedSecretPayload = await this.storage.getItem(keyForMnemonicId)
      if (!storedSecretPayload) {
        return false
      }
      const secretPayload = JSON.parse(storedSecretPayload) as Maybe<SecretPayload>
      if (!secretPayload || !secretPayload.ciphertext) {
        return false
      }
      const passwordPasswordEncryptionKey = await getEncryptionKeyFromPassword({ password, secretPayload })
      const passwordPasswordBase64String = await exportKey(passwordPasswordEncryptionKey)
      return currentPasswordBase64String === passwordPasswordBase64String
    } catch (_e) {
      return false
    }
  }

  async removePassword(): Promise<boolean> {
    await this.session.removeItem(ENCRYPTION_KEY_STORAGE_KEY)
    return true
  }

  /**
   * Changes the password by re-encrypting the mnemonic and all stored private keys with a new password
   * @param newPassword new password to encrypt with
   * @returns true if successful
   */
  async changePassword(newPassword: string): Promise<boolean> {
    try {
      const firstMnemonicId = (await this.getMnemonicIds())[0]

      if (!firstMnemonicId) {
        throw new Error(`${ErrorType.RetrieveMnemonicError}: Attempted to change password, but storage is empty.`)
      }

      // Get all addresses with stored private keys and decrypt them BEFORE changing password
      const privateKeyAddresses = await this.getAddressesForStoredPrivateKeys()
      const privateKeyPairs = await this.decryptPrivateKeys(privateKeyAddresses)

      // Re-encrypt the mnemonic with new password (this updates the session encryption key)
      const mnemonic = await this.retrieveMnemonicUnlocked(firstMnemonicId)
      await this.importMnemonic(mnemonic, newPassword, true)

      // Now re-encrypt all private keys with the new encryption key (from session)
      await this.encryptAndStorePrivateKeys(privateKeyPairs)

      return true
    } catch (err) {
      logger.error(err, { tags: { file: 'Keyring.web.ts', function: 'changePassword' } })
      return false
    }
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
  async importMnemonic(mnemonic: string, password: string, changingPassword = false): Promise<string> {
    const wallet = Wallet.fromMnemonic(mnemonic)

    const address = wallet.address

    const mnemonicId = await this.storeNewMnemonic({ mnemonic, password, address, forceOverwrite: changingPassword })
    if (!mnemonicId) {
      throw changingPassword
        ? new Error(`${ErrorType.StoreMnemonicError}: Failed to store mnemonic with new password`)
        : new Error(`${ErrorType.StoreMnemonicError}: Failed to import mnemonic`)
    }

    return mnemonicId
  }

  /**
   * Removes the mnemonic from storage.
   * @param mnemonicId key string associated with mnemonic to remove
   */
  async removeMnemonic(mnemonicId: string): Promise<boolean> {
    const key = this.keyForMnemonicId(mnemonicId)
    await this.storage.removeItem(key)
    return true
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

    if (!(await this.storeNewMnemonic({ mnemonic, password, address }))) {
      throw new Error(`${ErrorType.StoreMnemonicError}: Failed to generate and store mnemonic`)
    }
    return address
  }

  private async storeNewMnemonic({
    mnemonic,
    password,
    address,
    forceOverwrite = false,
  }: {
    mnemonic: string
    password: string
    address: string
    forceOverwrite?: boolean
  }): Promise<string | undefined> {
    const mnemonicKey = this.keyForMnemonicId(address)
    const mnemonicStorageValue = await this.storage.getItem(mnemonicKey)

    if (mnemonicStorageValue !== undefined && !forceOverwrite) {
      logger.debug('Keyring.web', 'storeNewMnemonic', 'mnemonic already stored. Did you mean to reimport?')

      return address
    }

    const secretPayload = await createEmptySecretPayload()

    const encryptionKey = await getEncryptionKeyFromPassword({ password, secretPayload })

    const secretPayloadWithCiphertext = await addEncryptedCiphertextToSecretPayload({
      secretPayload,
      plaintext: mnemonic,
      encryptionKey,
      additionalData: address,
    })

    await this.storage.setItem(mnemonicKey, JSON.stringify(secretPayloadWithCiphertext))
    const keyBase64 = await exportKey(encryptionKey)
    await this.session.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyBase64)

    return address
  }

  private keyForMnemonicId(mnemonicId: string): string {
    // NOTE: small difference with mobile implementation--native keychain prepends a custom prefix, but we must do it ourselves here.
    return entireMnemonicPrefix + mnemonicId
  }

  private async retrieveMnemonic(
    secretPayload: SecretPayload,
    encryptionKey: CryptoKey,
    expectedAddress: string,
  ): Promise<string> {
    try {
      if (!secretPayload.ciphertext) {
        throw new Error('No ciphertext found in secret payload')
      }

      const mnemonic = await decrypt({
        encryptionKey,
        ciphertext: decodeFromStorage(secretPayload.ciphertext),
        iv: decodeFromStorage(secretPayload.iv),
        additionalData: expectedAddress,
      })

      if (!mnemonic) {
        throw new Error('No mnemonic found in encrypted storage')
      }

      // validate mnemonic (will throw if invalid)
      Wallet.fromMnemonic(mnemonic)

      return mnemonic
    } catch (e) {
      throw new Error(`${ErrorType.RetrieveMnemonicError}: ${e}`)
    }
  }

  async retrieveMnemonicUnlocked(mnemonicId: string): Promise<string> {
    const encryptionKeyString = await this.session.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    if (!encryptionKeyString) {
      throw new Error(ErrorType.RetrievePasswordError)
    }

    const encryptionKey = await convertBase64SeedToCryptoKey(encryptionKeyString)
    const mnemonicKey = this.keyForMnemonicId(mnemonicId)
    const storedSecretPayload = await this.storage.getItem(mnemonicKey)
    if (!storedSecretPayload) {
      throw new Error(ErrorType.RetrieveMnemonicError)
    }

    const secretPayload = JSON.parse(storedSecretPayload) as Maybe<SecretPayload>
    if (!secretPayload) {
      throw new Error(ErrorType.RetrieveMnemonicError)
    }

    return await this.retrieveMnemonic(secretPayload, encryptionKey, mnemonicId)
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
   * Derives public address from mnemonic for a given `derivationIndex`.
   * @param mnemonic mnemonic to generate public address for
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key from the mnemonic
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  async generateAddressForMnemonic(mnemonic: string, derivationIndex: number): Promise<string> {
    const derivationPath = defaultPath + derivationIndex
    const walletAtIndex = Wallet.fromMnemonic(mnemonic, derivationPath)
    return walletAtIndex.address
  }

  /**
   * Derives public addresses from a mnemonic for a range of derivation indexes, non inclusive
   *
   * @param mnemonic mnemonic to generate private key for (current convention is to
   * use the public address associated with mnemonic at derivation index 0)
   * @param startIndex number used to specify the derivation index at which to start deriving private keys
   * from the mnemonic
   * @param stopIndex number used to specify the derivation index at which to stop deriving private keys
   * from the mnemonic, non-inclusive
   * @returns public addresses associated with the private keys generated from the mnemonic at the given derivation index range
   */
  async generateAddressesForMnemonic(mnemonic: string, startIndex: number, stopIndex: number): Promise<string[]> {
    if (startIndex >= stopIndex) {
      throw new Error('End derivation index must be greater than start derivation index')
    }

    const node = utils.HDNode.fromMnemonic(mnemonic)
    // the `defaultPath` from ethers appends the specific derivation index to the path
    // and we need to remove the last two elements "/0" to get the account node
    const accountNode = node.derivePath(defaultPath.slice(0, -2))
    const xpub = accountNode.neuter().extendedKey
    const hdKey = HDKey.fromExtendedKey(xpub)

    const addresses = []
    for (let i = startIndex; i < stopIndex; i++) {
      const pubKey = hdKey.deriveChild(i).publicKey
      if (!pubKey) {
        continue
      }

      const address = utils.computeAddress(pubKey)
      addresses.push(address)
    }

    return addresses
  }

  /**
   * Derives public addresses from `mnemonicId` for a range of derivation indexes, non inclusive
   *
   * @param mnemonicId key string associated with mnemonic to generate private key for (current convention is to
   * use the public address associated with mnemonic at derivation index 0)
   * @param startIndex number used to specify the derivation index at which to start deriving private keys
   * from the mnemonic
   * @param stopIndex number used to specify the derivation index at which to stop deriving private keys
   * from the mnemonic
   * @returns public addresses associated with the private keys generated from the mnemonic at the given derivation index range
   */
  async generateAddressesForMnemonicId(mnemonicId: string, startIndex: number, stopIndex: number): Promise<string[]> {
    const mnemonic = await this.retrieveMnemonicUnlocked(mnemonicId)
    return await this.generateAddressesForMnemonic(mnemonic, startIndex, stopIndex)
  }

  /**
   * Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`. Stores the private key in store with key.
   * @param mnemonicId key string associated with mnemonic to generate private key for (currently convention is to use public address associated with mnemonic)
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key from the mnemonic
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  async generateAndStorePrivateKey(mnemonicId: string, derivationIndex: number): Promise<string> {
    const mnemonic = await this.retrieveMnemonicUnlocked(mnemonicId)
    const derivationPath = defaultPath + derivationIndex
    const walletAtIndex = Wallet.fromMnemonic(mnemonic, derivationPath)

    const privateKey = walletAtIndex.privateKey
    const address = walletAtIndex.address

    return await this.storeNewPrivateKey(address, privateKey)
  }

  /**
   * Removes the private key from storage for the given address.
   * @param address account address to remove private key for
   * @returns success of removal
   */
  async removePrivateKey(address: string): Promise<boolean> {
    const key = this.keyForPrivateKey(address)
    try {
      await this.storage.removeItem(key)
      return true
    } catch (_e) {
      return false
    }
  }

  /** @returns address if the store call was successful. */
  private async storeNewPrivateKey(address: string, privateKey: string): Promise<string> {
    const checkStored = await this.retrievePrivateKey(address)

    if (checkStored !== undefined) {
      logger.debug('Keyring.web', 'storeNewPrivateKey', 'privateKey already stored. Did you mean to reimport?')

      return address
    }

    const encryptionKeyString = await this.session.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    if (!encryptionKeyString) {
      throw new Error(ErrorType.RetrievePasswordError)
    }

    const encryptionKey = await convertBase64SeedToCryptoKey(encryptionKeyString)

    try {
      const secretPayload = await createEmptySecretPayload()

      const secretPayloadWithCiphertext = await addEncryptedCiphertextToSecretPayload({
        secretPayload,
        plaintext: privateKey,
        encryptionKey,
        additionalData: address,
      })

      const newPrivateKeyStorageKey = this.keyForPrivateKey(address)
      logger.debug('Keyring.web', 'storeNewPrivateKey', 'storing new private key')
      await this.storage.setItem(newPrivateKeyStorageKey, JSON.stringify(secretPayloadWithCiphertext))

      return address
    } catch (e) {
      throw new Error(ErrorType.StoreMnemonicError + `: ${e}`)
    }
  }

  /**
   * Decrypts all private keys for the given addresses using the current session encryption key
   * @param addresses array of addresses to decrypt private keys for
   * @returns array of address/privateKey pairs
   */
  private async decryptPrivateKeys(addresses: string[]): Promise<{ address: string; privateKey: string }[]> {
    const privateKeyPairs: { address: string; privateKey: string }[] = []

    for (const address of addresses) {
      try {
        const privateKey = await this.retrievePrivateKey(address)
        if (privateKey) {
          privateKeyPairs.push({ address, privateKey })
        }
      } catch (error) {
        logger.error(error, {
          tags: { file: 'Keyring.web.ts', function: 'decryptPrivateKeys' },
          extra: { address },
        })
        throw new Error(`Failed to decrypt private key for address ${address}: ${error}`)
      }
    }

    return privateKeyPairs
  }

  /**
   * Encrypts private keys with the current session encryption key
   * @param privateKeyPairs array of address/privateKey pairs to re-encrypt
   */
  private async encryptAndStorePrivateKeys(privateKeyPairs: { address: string; privateKey: string }[]): Promise<void> {
    if (privateKeyPairs.length === 0) {
      return
    }

    // Get the current encryption key from session (should be the new one after password change)
    const encryptionKeyString = await this.session.getItem(ENCRYPTION_KEY_STORAGE_KEY)
    if (!encryptionKeyString) {
      throw new Error('No encryption key found in session after password change')
    }
    const encryptionKey = await convertBase64SeedToCryptoKey(encryptionKeyString)

    // Re-encrypt each private key with the new encryption key
    for (const { address, privateKey } of privateKeyPairs) {
      try {
        // Create new secret payload and encrypt with new key
        const secretPayload = await createEmptySecretPayload()
        const secretPayloadWithCiphertext = await addEncryptedCiphertextToSecretPayload({
          secretPayload,
          plaintext: privateKey,
          encryptionKey,
          additionalData: address,
        })

        // Store the re-encrypted private key
        const privateKeyStorageKey = this.keyForPrivateKey(address)
        await this.storage.setItem(privateKeyStorageKey, JSON.stringify(secretPayloadWithCiphertext))

        logger.debug(
          'Keyring.web',
          'reencryptDecryptedPrivateKeys',
          `Successfully re-encrypted private key for address ${address}`,
        )
      } catch (error) {
        logger.error(error, {
          tags: { file: 'Keyring.web.ts', function: 'reencryptDecryptedPrivateKeys' },
          extra: { address },
        })
        throw new Error(`Failed to re-encrypt private key for address ${address}: ${error}`)
      }
    }
  }

  private async retrievePrivateKey(address: string): Promise<string | undefined> {
    const key = this.keyForPrivateKey(address)
    const result = await this.storage.getItem(key)

    if (!result) {
      return undefined
    }

    try {
      const maybeSecretPayload = JSON.parse(result) as Maybe<SecretPayload>
      const encryptionKeyString = await this.session.getItem(ENCRYPTION_KEY_STORAGE_KEY)
      if (!encryptionKeyString || !maybeSecretPayload?.ciphertext) {
        throw new Error(ErrorType.RetrievePasswordError)
      }

      const encryptionKey = await convertBase64SeedToCryptoKey(encryptionKeyString)

      const privateKey = await decrypt({
        encryptionKey,
        ciphertext: decodeFromStorage(maybeSecretPayload.ciphertext),
        iv: decodeFromStorage(maybeSecretPayload.iv),
        additionalData: address,
      })

      if (!privateKey) {
        return undefined
      }

      // validate private key (will throw if invalid)
      const wallet = new Wallet(privateKey)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  async signTransactionHashForAddress(address: string, hash: string, chainId: number): Promise<string> {
    // Ethers.js doesn't differentiate between signing a random hash and signing a transaction hash
    return this.signHashForAddress(address, hash, chainId)
  }

  // adds EIP-191 prefix
  // https://docs.ethers.org/v5/api/signer/#Signer-signMessage
  async signMessageForAddress(address: string, message: string): Promise<string> {
    const privateKey = await this.retrievePrivateKey(address)
    if (!privateKey) {
      throw Error('No private key found for address')
    }
    const wallet = new Wallet(privateKey)
    return wallet.signMessage(message)
  }

  /**
   * signs raw 32-byte hashes
   * @returns the Signature of the signed hash in string form.
   **/
  async signHashForAddress(address: string, hash: string, _chainId: number): Promise<string> {
    const privateKey = await this.retrievePrivateKey(address)
    if (!privateKey) {
      throw Error('No private key found for address')
    }
    const signingKey = new SigningKey(privateKey)
    const signature: Signature = signingKey.signDigest(hash)
    return joinSignature(signature)
  }
}

export const Keyring = new WebKeyring()

import { NotImplementedError } from 'utilities/src/errors'

/**
 * Provides the generation, storage, and signing logic for mnemonics and private keys.
 */
export interface IKeyring {
  /** @returns true if password can successfully decrypt mnemonics stored in storage. */
  unlock(password: string): Promise<boolean>

  /** Locks keyring */
  lock(): Promise<boolean>

  /** @returns true if input password matches current password */
  checkPassword(password: string): Promise<boolean>

  /**
   * Changes password and re-encrypts stored mnemonics
   * @returns true if successful
   */
  changePassword(newPassword: string): Promise<boolean>

  /**
   * Fetches all mnemonic IDs, which are used as keys to access the actual mnemonics
   * in key-value store.
   * @returns array of mnemonic IDs
   */
  getMnemonicIds(): Promise<string[]>

  /**
   * Derives private key from mnemonic with derivation index 0 and retrieves
   * associated public address. Stores imported mnemonic in store with the
   * mnemonic ID key as the public address.

   * @param mnemonic The mnemonic phrase to import
   * @param password The password used to encrypt the mnemonic. Marked as optional depending on the platform.
   * @returns public address from the mnemonic's first derived private key
   */
  importMnemonic(mnemonic: string, password?: string): Promise<string>

  /**
   * Removes the mnemonic from storage / keychain.
   * @param mnemonicId key string associated with mnemonic to remove
   */
  removeMnemonic(mnemonicId: string): Promise<boolean>

  /**
   * Generates a new mnemonic and retrieves associated public address. Stores new mnemonic in local storage
   * with the mnemonic ID key as the public address.
   *
   * @param password The password used to encrypt the mnemonic. Marked as optional depending on the platform.
   * @returns public address from the mnemonic's first derived private key
   */
  generateAndStoreMnemonic(password?: string): Promise<string>

  /**
   * Fetches all public addresses from private keys stored under `privateKeyPrefix` in platform storage.
   *
   * Used to verify platform storage has the private key for an account that is attempting create a NativeSigner
   * that calls native signing methods
   *
   * @returns public addresses for all stored private keys
   */
  getAddressesForStoredPrivateKeys(): Promise<string[]>

  /**
   * Derives public address from `mnemonic` for a given `derivationIndex`.
   *
   * @param mnemonic mnemonic to generate public address for
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key
   * from the mnemonic
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  generateAddressForMnemonic(mnemonic: string, derivationIndex: number): Promise<string>

  /**
   * Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`.
   * Stores the private key in platform storage with key.
   *
   * @param mnemonicId key string associated with mnemonic to generate private key for (currently convention is to
   * use public address associated with mnemonic)
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key
   * from the mnemonic
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  generateAndStorePrivateKey(mnemonicId: string, derivationIndex: number): Promise<string>

  signTransactionHashForAddress(address: string, hash: string, chainId: number): Promise<string>

  signMessageForAddress(address: string, message: string): Promise<string>

  signHashForAddress(address: string, hash: string, chainId: number): Promise<string>

  retrieveMnemonicUnlocked(address: string): Promise<string | undefined>
}

/** Dummy Keyring implementation.  */
class NullKeyring implements IKeyring {
  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  lock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  checkPassword(_password: string): Promise<boolean> {
    throw new NotImplementedError('checkPassword')
  }

  changePassword(_newPassword: string): Promise<boolean> {
    throw new NotImplementedError('changePassword')
  }

  removePassword(): Promise<boolean> {
    throw new NotImplementedError('removePassword')
  }

  getMnemonicIds(): Promise<string[]> {
    throw new NotImplementedError('getMnemonicIds')
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(): Promise<string> {
    throw new NotImplementedError('importMnemonic')
  }

  removeMnemonic(_menemonicId: string): Promise<boolean> {
    throw new NotImplementedError('removeMnemonic')
  }

  retrieveMnemonicUnlocked(_address: string): Promise<string | undefined> {
    throw new Error('Method not implemented.')
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(_password?: string): Promise<string> {
    throw new NotImplementedError('generateAndStoreMnemonic')
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    throw new NotImplementedError('getAddressesForStoredPrivateKeys')
  }

  // returns the address for a given mnemonic
  generateAddressForMnemonic(_menemonic: string, _derivationIndex: number): Promise<string> {
    throw new NotImplementedError('generateAddressForMnemonic')
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(_menemonicId: string, _derivationIndex: number): Promise<string> {
    throw new NotImplementedError('generateAndStorePrivateKey')
  }

  removePrivateKey(_address: string): Promise<boolean> {
    throw new NotImplementedError('removePrivateKey')
  }

  signTransactionHashForAddress(
    _address: string,
    _hash: string,
    _chainId: number
  ): Promise<string> {
    throw new NotImplementedError('signTransactionHashForAddress')
  }

  signMessageForAddress(_address: string, _message: string): Promise<string> {
    throw new NotImplementedError('signMessageForAddress')
  }

  signHashForAddress(_address: string, _hash: string, _chainId: number): Promise<string> {
    throw new NotImplementedError('signHashForAddress')
  }
}

// Will be overridden by the compiler with platform-specific Keyring
export const Keyring = new NullKeyring()

/* eslint-disable max-params */
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Provides the generation, storage, and signing logic for mnemonics and private keys.
 */
export interface IKeyring {
  removeAllMnemonicsAndPrivateKeys(): Promise<boolean>

  /** @returns true if the extension is unlocked (encryption key kept in session storage can unencrypt the mnemonic) */
  isUnlocked(): Promise<boolean>

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
   * @param password The password used to encrypt the mnemonic. Implemented on web only.
   * @param allowOverwrite Allows to overwrite previously imported mnemonic phrase. Implemented on web only.
   * @returns public address from the mnemonic's first derived private key
   */
  importMnemonic(mnemonic: string, password?: string, allowOverwrite?: boolean): Promise<string>

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
   * Derives public addresses from a mnemonic for a range of derivation indexes.
   *
   * @param mnemonic mnemonic to generate private key for (current convention is to
   * use the public address associated with mnemonic at derivation index 0)
   * @param startIndex number used to specify the derivation index at which to start deriving private keys
   * from the mnemonic
   * @param stopIndex number used to specify the derivation index at which to stop deriving private keys
   * from the mnemonic
   * @returns public addresses associated with the private keys generated from the mnemonic at the given derivation index range
   */
  generateAddressesForMnemonic(mnemonic: string, startIndex: number, stopIndex: number): Promise<Array<string>>

  /**
   * Derives public addresses from `mnemonicId` for a range of derivation indexes.
   *
   * @param mnemonicId key string associated with mnemonic to generate private key for (current convention is to
   * use the public address associated with mnemonic at derivation index 0)
   * @param startIndex number used to specify the derivation index at which to start deriving private keys
   * from the mnemonic
   * @param stopIndex number used to specify the derivation index at which to stop deriving private keys
   * from the mnemonic
   * @returns public addresses associated with the private keys generated from the mnemonic at the given derivation index range
   */
  generateAddressesForMnemonicId(mnemonicId: string, startIndex: number, stopIndex: number): Promise<Array<string>>

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

  removePrivateKey(address: string): Promise<boolean>

  signTransactionHashForAddress(address: string, hash: string, chainId: number): Promise<string>

  signMessageForAddress(address: string, message: string): Promise<string>

  signHashForAddress(address: string, hash: string, chainId: number): Promise<string>

  retrieveMnemonicUnlocked(address: string): Promise<string | undefined>

  generateKeyPairForPasskeyWallet(): Promise<string>

  decryptMnemonicForPasskey(encryptedMnemonic: string, publicKeyBase64: string): Promise<string>
}

/** Dummy Keyring implementation.  */
class NullKeyring implements IKeyring {
  removeAllMnemonicsAndPrivateKeys(): Promise<boolean> {
    throw new PlatformSplitStubError('removeAllMnemonicsAndPrivateKeys')
  }

  generateAddressesForMnemonic(
    _mnemonic: string,
    _startDerivationIndex: number,
    _endDerivationIndex: number,
  ): Promise<string[]> {
    throw new PlatformSplitStubError('generateAddressesForMnemonic')
  }

  generateAddressesForMnemonicId(
    _mnemonicId: string,
    _startDerivationIndex: number,
    _endDerivationIndex: number,
  ): Promise<string[]> {
    throw new PlatformSplitStubError('generateAddressesForMnemonicId')
  }

  isUnlocked(): Promise<boolean> {
    throw new PlatformSplitStubError('isUnlocked')
  }

  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  lock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  checkPassword(_password: string): Promise<boolean> {
    throw new PlatformSplitStubError('checkPassword')
  }

  changePassword(_newPassword: string): Promise<boolean> {
    throw new PlatformSplitStubError('changePassword')
  }

  removePassword(): Promise<boolean> {
    throw new PlatformSplitStubError('removePassword')
  }

  getMnemonicIds(): Promise<string[]> {
    throw new PlatformSplitStubError('getMnemonicIds')
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(_mnemonic: string, _password?: string, _allowOverwrite?: boolean): Promise<string> {
    throw new PlatformSplitStubError('importMnemonic')
  }

  removeMnemonic(_menemonicId: string): Promise<boolean> {
    throw new PlatformSplitStubError('removeMnemonic')
  }

  retrieveMnemonicUnlocked(_address: string): Promise<string> {
    throw new PlatformSplitStubError('retrieveMnemonicUnlocked')
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(_password?: string): Promise<string> {
    throw new PlatformSplitStubError('generateAndStoreMnemonic')
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    throw new PlatformSplitStubError('getAddressesForStoredPrivateKeys')
  }

  // returns the address for a given mnemonic
  generateAddressForMnemonic(_menemonic: string, _derivationIndex: number): Promise<string> {
    throw new PlatformSplitStubError('generateAddressForMnemonic')
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(_menemonicId: string, _derivationIndex: number): Promise<string> {
    throw new PlatformSplitStubError('generateAndStorePrivateKey')
  }

  removePrivateKey(_address: string): Promise<boolean> {
    throw new PlatformSplitStubError('removePrivateKey')
  }

  signTransactionHashForAddress(_address: string, _hash: string, _chainId: number): Promise<string> {
    throw new PlatformSplitStubError('signTransactionHashForAddress')
  }

  signMessageForAddress(_address: string, _message: string): Promise<string> {
    throw new PlatformSplitStubError('signMessageForAddress')
  }

  signHashForAddress(_address: string, _hash: string, _chainId: number): Promise<string> {
    throw new PlatformSplitStubError('signHashForAddress')
  }

  generateKeyPairForPasskeyWallet(): Promise<string> {
    throw new PlatformSplitStubError('generateKeyPairForPasskeyWallet')
  }

  decryptMnemonicForPasskey(_encryptedMnemonic: string, _publicKeyBase64: string): Promise<string> {
    throw new PlatformSplitStubError('decryptMnemonicForPasskey')
  }
}

// Will be overridden by the compiler with platform-specific Keyring
export const Keyring = new NullKeyring()

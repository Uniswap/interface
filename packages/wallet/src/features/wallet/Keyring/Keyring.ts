// Based on https://github.com/Uniswap/wallet-internal/blob/main/apps/mobile/src/lib/RNEthersRs.ts

/**
 * Provides the generation, storage, and signing logic for mnemonics and private keys.
 */
export interface IKeyring {
  /** @returns true if password can successfully decrypt mnemonics stored in storage. */
  unlock(password: string): Promise<boolean>

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
   * Derives private key and public address from mnemonic associated with `mnemonicId` for given `derivationIndex`.
   * Stores the private key in platform storage with key.
   *
   * @param mnemonicId key string associated with mnemonic to generate private key for (currently convention is to
   * use public address associated with mnemonic)
   * @param derivationIndex number used to specify a which derivation index to use for deriving a private key
   * from the mnemonic
   * @param password The password used to encrypt the private key. Marked as optional depending on the platform.
   * @returns public address associated with private key generated from the mnemonic at given derivation index
   */
  generateAndStorePrivateKey(
    mnemonicId: string,
    derivationIndex: number,
    password?: string
  ): Promise<string>

  signTransactionHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string>

  signMessageForAddress(address: string, message: string): Promise<string>

  signHashForAddress(
    address: string,
    hash: string,
    chainId: number
  ): Promise<string>
}

/** Dummy Keyring implementation.  */
class NullKeyring implements IKeyring {
  unlock(): Promise<boolean> {
    return Promise.resolve(true)
  }

  getMnemonicIds(): Promise<string[]> {
    throw new NotImplementedError('getMnemonicIds')
  }

  // returns the mnemonicId (derived address at index 0) of the imported mnemonic
  importMnemonic(): Promise<string> {
    throw new NotImplementedError('importMnemonic')
  }

  // returns the mnemonicId (derived address at index 0) of the stored mnemonic
  generateAndStoreMnemonic(): Promise<string> {
    throw new NotImplementedError('generateAndStoreMnemonic')
  }

  getAddressesForStoredPrivateKeys(): Promise<string[]> {
    throw new NotImplementedError('getAddressesForStoredPrivateKeys')
  }

  // returns the address of the generated key
  generateAndStorePrivateKey(): Promise<string> {
    throw new NotImplementedError('generateAndStorePrivateKey')
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

  signHashForAddress(
    _address: string,
    _hash: string,
    _chainId: number
  ): Promise<string> {
    throw new NotImplementedError('signHashForAddress')
  }
}

class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(
      `KeyManager.${functionName}() not implemented. Did you forget a platform override?`
    )
    this.name = this.constructor.name
  }
}

// Will be overriden by the compiler with platform-specific Keyring
export const Keyring = new NullKeyring()

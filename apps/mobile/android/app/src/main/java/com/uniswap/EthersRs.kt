package com.uniswap

/**
 * These functions are defined from an object to be used from a static context.
 * The Rust implementation contains JNI bindings that are generated from the definition here.
 */
object EthersRs {

  /**
   * Validates a mnemonic string to check that each word exists in the BIP 39 wordlist.
   * @param mnemonic - the mnemonic string
   * @return The first invalid word. If there are none, an invalid string.
   */
  external fun findInvalidWord(mnemonic: String): String

  /**
   * General validation for a mnemonic string, including entropy.
   * @param mnemonic - the mnemonic string
   * @return True if valid and false if not.
   */
  external fun validateMnemonic(mnemonic: String): Boolean

  /**
   * Generates a mnemonic and its associated address.
   * @return A CMnemonicAndAddress object containing the generated mnemonic and its associated address.
   */
  external fun generateMnemonic(): MnemonicAndAddress

  /**
   * Generates a private key from a given mnemonic.
   * @param mnemonic The mnemonic to generate the private key from.
   * @param index The index of the private key to generate.
   * @return A CPrivateKey object containing the generated private key.
   */
  external fun privateKeyFromMnemonic(mnemonic: String?, index: Int): PrivateKeyAndAddress

  /**
   * Creates a wallet from a given private key.
   * @param privateKey The private key to create the wallet from.
   * @return A long representing the pointer to the created wallet.
   */
  external fun walletFromPrivateKey(privateKey: String?): Long

  /**
   * Frees the memory allocated for the wallet.
   * @param walletPtr The pointer to the wallet to be freed.
   */
  external fun walletFree(walletPtr: Long)

  /**
   * Signs a transaction with a wallet.
   * @param localWallet The wallet to sign the transaction with.
   * @param txHash The transaction hash to sign.
   * @param chainId The id of the blockchain network.
   * @return A signed transaction hash.
   */
  external fun signTxWithWallet(
    localWallet: Long,
    txHash: String,
    chainId: Long
  ): String

  /**
   * Signs a message with a wallet.
   * @param localWallet The wallet to sign the message with.
   * @param message The message to sign.
   * @return The signed message.
   */
  external fun signMessageWithWallet(
    localWallet: Long,
    message: String
  ): String

  /**
   * Signs a hash with a wallet.
   * @param localWallet The wallet to sign the hash with.
   * @param hash The hash to sign.
   * @param chainId The id of the blockchain network.
   * @return The signed hash.
   */
  external fun signHashWithWallet(
    localWallet: Long,
    hash: String,
    chainId: Long
  ): String
}

/**
 * Represents a private key and its associated address.
 * @property privateKey The private key.
 * @property address The address associated with the private key.
 */
class PrivateKeyAndAddress(
  var privateKey: String,
  var address: String,
)

/**
 * Represents a mnemonic and its associated address.
 * @property mnemonic The mnemonic phrase.
 * @property address The address associated with the mnemonic.
 */
class MnemonicAndAddress(
  var mnemonic: String,
  var address: String,
)

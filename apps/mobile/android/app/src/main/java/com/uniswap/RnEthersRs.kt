package com.uniswap

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.uniswap.EthersRs.generateMnemonic
import com.uniswap.EthersRs.privateKeyFromMnemonic
import com.uniswap.EthersRs.signHashWithWallet
import com.uniswap.EthersRs.signMessageWithWallet
import com.uniswap.EthersRs.signTxWithWallet
import com.uniswap.EthersRs.walletFromPrivateKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RnEthersRs(applicationContext: Context) {

  // Long represents the opaque pointer to the Rust LocalWallet struct.
  private val walletCache: MutableMap<String, Long> = mutableMapOf()
  private val keychain: SharedPreferences

  init {
    val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    keychain = EncryptedSharedPreferences.create(
      "preferences",
      masterKeyAlias,
      applicationContext,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
  }

  val mnemonicIds: List<String>
    get() = keychain.all.keys.filter {
        // MOB-3453 this will need to be updated after fixing prefixes
        it.startsWith(MNEMONIC_PREFIX)
      }.map {
        key -> key.replace(MNEMONIC_PREFIX, "")
      }

  /**
   * Imports a mnemonic and returns the associated address.
   * @param mnemonic The mnemonic to import.
   * @return The address associated with the mnemonic.
   */
  fun importMnemonic(mnemonic: String): String {
    val privateKey = privateKeyFromMnemonic(mnemonic, 0)
    val address = privateKey.address
    return storeNewMnemonic(mnemonic, address)
  }

  /**
   * Generates a new mnemonic, stores it, and returns the associated address.
   * @return The address associated with the new mnemonic.
   */
  fun generateAndStoreMnemonic(): String {
    val mnemonic = generateMnemonic()
    val mnemonicStr = mnemonic.mnemonic
    val addressStr = mnemonic.address
    return storeNewMnemonic(mnemonicStr, addressStr)
  }

  /**
   * Stores a new mnemonic and its associated address.
   * @param mnemonic The mnemonic to store.
   * @param address The address associated with the mnemonic.
   * @return The address.
   */
  fun storeNewMnemonic(mnemonic: String?, address: String): String {
    val checkStored = retrieveMnemonic(address)
    if (checkStored == null) {
      val newMnemonicKey = keychainKeyForMnemonicId(address)
      keychain.edit().putString(newMnemonicKey, mnemonic).apply()
    }
    return address
  }


  private fun keychainKeyForMnemonicId(mnemonicId: String): String {
    return MNEMONIC_PREFIX + mnemonicId
  }

  fun retrieveMnemonic(mnemonicId: String): String? {
    return keychain.getString(keychainKeyForMnemonicId(mnemonicId), null)
  }

  suspend fun removeMnemonic(mnemonicId: String): Boolean {
    keychain.edit().remove(keychainKeyForMnemonicId(mnemonicId)).apply()
    return true
  }

  val addressesForStoredPrivateKeys: List<String>
    get() = keychain.all.keys
      .filter { key -> key.contains(PRIVATE_KEY_PREFIX) }
      .map { key -> key.replace(PRIVATE_KEY_PREFIX, "") }

  private fun storeNewPrivateKey(address: String, privateKey: String?) {
    val newKey = keychainKeyForPrivateKey(address)
    keychain.edit().putString(newKey, privateKey).apply()
  }

  /**
   * Generates public address for a given mnemonic and returns the associated address.
   * @param mnemonic Mmnemonic to generate the public address from.
   * @param derivationIndex The index of the private key to generate.
   * @return The address associated with the new private key.
   */
  fun generateAddressForMnemonic(mnemonic: String, derivationIndex: Int): String {
    val privateKey = privateKeyFromMnemonic(mnemonic, derivationIndex)
    return privateKey.address
  }

  /**
   * Generates and stores a new private key for a given mnemonic and returns the associated address.
   * @param mnemonicId The id of the mnemonic to generate the private key from.
   * @param derivationIndex The index of the private key to generate.
   * @return The address associated with the new private key.
   */
  fun generateAndStorePrivateKey(mnemonicId: String, derivationIndex: Int): String {
    val mnemonic = retrieveMnemonic(mnemonicId)
      ?: throw IllegalArgumentException("Mnemonic not found")

    val privateKey = privateKeyFromMnemonic(mnemonic, derivationIndex)
    val xprv = privateKey.privateKey
    val address = privateKey.address
    storeNewPrivateKey(address, xprv)
    return address
  }

  suspend fun removePrivateKey(address: String): Boolean {
    keychain.edit().remove(keychainKeyForPrivateKey(address)).apply()
    return true
  }

  /**
   * Signs a transaction for a given address.
   * @param address The address to sign the transaction for.
   * @param hash The transaction hash to sign.
   * @param chainId The id of the blockchain network.
   * @return The signed transaction hash.
   */
  fun signTransactionHashForAddress(address: String, hash: String, chainId: Long): String {
    val wallet = retrieveOrCreateWalletForAddress(address)
    return signTxWithWallet(wallet, hash, chainId)
  }

  /**
   * Signs a message for a given address.
   * @param address The address to sign the message for.
   * @param message The message to sign.
   * @return The signed message.
   */
  fun signMessageForAddress(address: String, message: String): String {
    val wallet = retrieveOrCreateWalletForAddress(address)
    return signMessageWithWallet(wallet, message)
  }

  /**
   * Signs a hash for a given address.
   * @param address The address to sign the hash for.
   * @param hash The hash to sign.
   * @param chainId The id of the blockchain network.
   * @return The signed hash.
   */
  fun signHashForAddress(address: String, hash: String, chainId: Long): String {
    val wallet = retrieveOrCreateWalletForAddress(address)
    return signHashWithWallet(wallet, hash, chainId)
  }

  /**
   * Retrieves an existing wallet for a given address or creates a new one if it doesn't exist.
   * @param address The address of the wallet.
   * @return A long representing the pointer to the wallet.
   */
  private fun retrieveOrCreateWalletForAddress(address: String): Long {
    val wallet = walletCache[address]
    if (wallet != null) {
      return wallet
    }
    val privateKey = retrievePrivateKey(address)
    val newWallet = walletFromPrivateKey(privateKey)
    walletCache[address] = newWallet
    return newWallet
  }

  /**
   * Retrieves the private key for a given address.
   * @param address The address to retrieve the private key for.
   * @return The private key, or null if it doesn't exist.
   */
  fun retrievePrivateKey(address: String): String? {
    return keychain.getString(keychainKeyForPrivateKey(address), null)
  }
  /**
   * Generates the keychain key for a given address.
   * @param address The address to generate the key for.
   * @return The keychain key.
   */
  private fun keychainKeyForPrivateKey(address: String): String {
    return PRIVATE_KEY_PREFIX + address
  }

  companion object {
    private const val PREFIX = "com.uniswap"
    private const val MNEMONIC_PREFIX = ".mnemonic."
    private const val PRIVATE_KEY_PREFIX = ".privateKey."
    // MOB-3453 Android is currently not storing keys with PREFIX
    private const val ENTIRE_MNEMONIC_PREFIX = PREFIX + MNEMONIC_PREFIX
  }
}

package com.uniswap

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import decryptMnemonic
import generateRsaKeyPair
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.security.KeyPair

class EmbeddedWalletModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  private val publicKeyPairMap = mutableMapOf<String, KeyPair>()

  override fun getName() = "EmbeddedWallet"

  @ReactMethod
  fun decryptMnemonicForPublicKey(encryptedMnemonic: String, publicKeyBase64: String, promise: Promise) {
    val keyPair = publicKeyPairMap[publicKeyBase64] ?: run {
      promise.reject(
        "KEY_PAIR_NOT_FOUND",
        "Key pair not found for public key $publicKeyBase64",
        IllegalStateException("Key pair not found for public key $publicKeyBase64")
      )
      return
    }

    scope.launch {
      try {
        val decryptedMnemonic = decryptMnemonic(encryptedMnemonic, keyPair)
        publicKeyPairMap.remove(publicKeyBase64)
        promise.resolve(decryptedMnemonic)
      } catch (e: Exception) {
        promise.reject("DECRYPT_ERROR", "Failed to decrypt mnemonic", e)
      }
    }
  }

  @ReactMethod
  fun generateKeyPair(promise: Promise) {
    scope.launch {
      try {
        val pair = generateRsaKeyPair()
        publicKeyPairMap[pair.first] = pair.second
        promise.resolve(pair.first)
      } catch (e: Exception) {
        promise.reject("KEYPAIR_GENERATION_ERROR", "Failed to generate key pair", e)
      }
    }
  }
}

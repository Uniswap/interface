package com.uniswap;
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.module.annotations.ReactModule
import com.facebook.soloader.SoLoader
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Bridge between the React Native JavaScript code and the native Android code.
 * It provides several methods that can be called from JavaScript, using the @ReactMethod annotation.
 * The module uses the RnEthersRs class, which is initialized with the application context.
 * The native library "ethers_ffi" is loaded when the module is initialized (`libethers_ffi.so`).
 */
@ReactModule(name = "RNEthersRS")
class RNEthersRSModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val ethersRs: RnEthersRs = RnEthersRs(reactContext.applicationContext)
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  // Needs to be initialized form a static context
  companion object {
    init {
      SoLoader.loadLibrary("ethers_ffi")
    }
  }

  override fun getName() = "RNEthersRS"

  @ReactMethod fun getMnemonicIds(promise: Promise) {
    val array = WritableNativeArray()
    ethersRs.mnemonicIds.forEach {
      array.pushString(it)
    }
    promise.resolve(array)
  }

  @ReactMethod fun importMnemonic(mnemonic: String, promise: Promise) {
    promise.resolve(ethersRs.importMnemonic(mnemonic))
  }

  @ReactMethod fun removeMnemonic(mnemonicId: String, promise: Promise) {
    scope.launch(Dispatchers.IO) {
      val result = ethersRs.removeMnemonic(mnemonicId)
      promise.resolve(result)
    }
  }

  @ReactMethod fun generateAndStoreMnemonic(promise: Promise) {
    promise.resolve(ethersRs.generateAndStoreMnemonic())
  }

  @ReactMethod fun getAddressesForStoredPrivateKeys(promise: Promise) {
    val addresses = ethersRs.addressesForStoredPrivateKeys

    // Convert the List<String> to a WritableArray for passing over the bridge
    val writableArray: WritableArray = WritableNativeArray()
    for (address in addresses) {
      writableArray.pushString(address)
    }

    promise.resolve(writableArray)
  }

  @ReactMethod fun generateAddressForMnemonic(mnemonic: String, derivationIndex: Int, promise: Promise) {
    promise.resolve(ethersRs.generateAddressForMnemonic(mnemonic, derivationIndex))
  }

  @ReactMethod fun generateAndStorePrivateKey(mnemonicId: String, derivationIndex: Int, promise: Promise) {
    try {
      promise.resolve(ethersRs.generateAndStorePrivateKey(mnemonicId, derivationIndex))
    } catch (error: Exception) {
      promise.reject(error)
    }
  }

  @ReactMethod fun removePrivateKey(address: String, promise: Promise) {
    scope.launch(Dispatchers.IO) {
      val result = ethersRs.removePrivateKey(address)
      promise.resolve(result)
    }
  }

  @ReactMethod fun signTransactionHashForAddress(address: String, hash: String, chainId: Int, promise: Promise) {
    promise.resolve(ethersRs.signTransactionHashForAddress(address, hash, chainId.toLong()))
  }

  @ReactMethod fun signMessageForAddress(address: String, message: String, promise: Promise) {
    promise.resolve(ethersRs.signMessageForAddress(address, message))
  }

  @ReactMethod fun signHashForAddress(address: String, hash: String, chainId: Int, promise: Promise) {
    promise.resolve(ethersRs.signHashForAddress(address, hash, chainId.toLong()))
  }
}

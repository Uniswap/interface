package com.uniswap

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import androidx.multidex.MultiDexApplication
import com.shopify.reactnativeperformance.ReactNativePerformance
import com.uniswap.onboarding.scantastic.ScantasticEncryptionModule

class MainApplication : MultiDexApplication(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
          add(UniswapPackage())
          add(RNCloudStorageBackupsManagerModule())
          add(ScantasticEncryptionModule())
        }
      override fun getJSMainModuleName(): String {
        return "index"
      }

      override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
      }

      override val isNewArchEnabled: Boolean
        get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

      override val isHermesEnabled: Boolean
        get() = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

  override fun onCreate() {
    ReactNativePerformance.onAppStarted()
    super.onCreate()
    SoLoader.init(this,false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager);
  }
}

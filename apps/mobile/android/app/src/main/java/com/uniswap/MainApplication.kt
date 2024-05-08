package com.uniswap

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader
import androidx.multidex.MultiDexApplication;
import com.shopify.reactnativeperformance.ReactNativePerformance
import com.uniswap.onboarding.scantastic.ScantasticEncryptionModule

class MainApplication : MultiDexApplication(), ReactApplication {
  private val mReactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
      }

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

      override val isNewArchEnabled: Boolean
        get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

      override val isHermesEnabled: Boolean
        get() = BuildConfig.IS_HERMES_ENABLED
    }

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  override fun onCreate() {
    ReactNativePerformance.onAppStarted()
    super.onCreate()
    SoLoader.init(this,false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager);
  }
}

package com.uniswap

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.uniswap.onboarding.backup.MnemonicDisplayViewManager
import com.uniswap.onboarding.backup.MnemonicConfirmationViewManager
import com.uniswap.onboarding.import.SeedPhraseInputViewManager

class UniswapPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<out View, out ReactShadowNode<*>>> = listOf(
      MnemonicConfirmationViewManager(),
      MnemonicDisplayViewManager(),
      SeedPhraseInputViewManager(),
    )

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(
      AndroidDeviceModule(reactContext),
      RNEthersRSModule(reactContext),
      ThemeModule(reactContext),
    )
}

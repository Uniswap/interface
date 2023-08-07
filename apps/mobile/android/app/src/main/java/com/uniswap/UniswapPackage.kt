package com.uniswap

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import com.uniswap.onboarding.MnemonicDisplayViewManager
import com.uniswap.onboarding.MnemonicConfirmationViewManager

class UniswapPackage : ReactPackage {
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<out View, out ReactShadowNode<*>>> = listOf(
      MnemonicDisplayViewManager(),
      MnemonicConfirmationViewManager(),
    )

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(
      ThemeModule(reactContext),
      RNEthersRSModule(reactContext)
    )
}

package com.uniswap.onboarding

import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.uniswap.onboarding.MnemonicDisplayViewManager.Companion.MOCK_WORDS
import com.uniswap.onboarding.ui.MnemonicConfirmation
import com.uniswap.theme.UniswapComponent

/**
 * View manager used to import native component into React Native code
 * for the MnemonicTest component used to test if user has saved their
 * seed phrase
 */
class MnemonicTestViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    return ComposeView(reactContext).apply {
      setContent {
        UniswapComponent {
          // TODO gary replace with mock words or real data and phrase testing functionality
          MnemonicConfirmation(sourceWords = MOCK_WORDS)
        }
      }
    }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicTest"
  }
}

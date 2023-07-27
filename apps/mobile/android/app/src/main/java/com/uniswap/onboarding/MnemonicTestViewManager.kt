package com.uniswap.onboarding

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.uniswap.onboarding.ui.MnemonicView

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
        MaterialTheme {
          Surface(modifier = Modifier.fillMaxSize()) {
            // TODO gary replace with mock words or real data and phrase testing functionality
            MnemonicView(words = emptyList())
          }
        }
      }
    }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicTest"
  }
}

package com.uniswap.onboarding

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.uniswap.onboarding.ui.MnemonicView
import com.uniswap.theme.UniswapComponent

/**
 * View manager used to import native component into React Native code
 * for the MnemonicDisplay component used to show the seed phrases
 */
class MnemonicDisplayViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    return ComposeView(reactContext).apply {
      setContent {
        UniswapComponent {
          MnemonicView(words = MOCK_WORDS) // TODO gary replace with real words
        }
      }
    }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicDisplay"
    private val MOCK_WORDS = listOf(
      "video",
      "dignity",
      "pond",
      "segment",
      "lock",
      "pen",
      "friend",
      "heart",
      "torch",
      "artefact",
      "profit",
      "concert",
    )
  }
}

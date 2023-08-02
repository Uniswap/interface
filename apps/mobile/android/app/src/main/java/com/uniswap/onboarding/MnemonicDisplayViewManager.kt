package com.uniswap.onboarding

import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.uniswap.onboarding.ui.MnemonicDisplay
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
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
          MnemonicDisplay(words = MOCK_WORDS.map { MnemonicWordUiState(text = it) }) // TODO gary replace with real words
        }
      }
    }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicDisplay"
    val MOCK_WORDS = listOf(
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

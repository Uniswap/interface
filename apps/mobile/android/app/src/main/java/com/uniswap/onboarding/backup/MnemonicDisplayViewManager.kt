package com.uniswap.onboarding.backup

import android.view.View
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.backup.ui.MnemonicDisplay
import com.uniswap.onboarding.backup.ui.MnemonicDisplayViewModel
import com.uniswap.theme.UniswapComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

/**
 * View manager used to import native component into React Native code
 * for the MnemonicDisplay component used to show the seed phrases
 */
class MnemonicDisplayViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  private val mnemonicIdFlow = MutableStateFlow("")

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    val ethersRs = RnEthersRs(reactContext)
    val viewModel = MnemonicDisplayViewModel(ethersRs)

    return ComposeView(reactContext).apply {
      setContent {
        val mnemonicId by mnemonicIdFlow.collectAsState()

        UniswapComponent {
          MnemonicDisplay(mnemonicId = mnemonicId, viewModel = viewModel)
        }
      }
    }
  }

  @ReactProp(name = "mnemonicId")
  fun setMnemonicId(view: View, mnemonicId: String) {
    mnemonicIdFlow.update { mnemonicId }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicDisplay"
  }
}

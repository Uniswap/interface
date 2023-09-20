package com.uniswap.onboarding.backup

import android.view.View
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.uniswap.R
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.backup.ui.MnemonicConfirmation
import com.uniswap.onboarding.backup.ui.MnemonicConfirmationViewModel
import com.uniswap.theme.UniswapComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

/**
 * View manager used to import native component into React Native code
 * for the MnemonicTest component used to test if user has saved their
 * seed phrase
 */
class MnemonicConfirmationViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  private val mnemonicIdFlow = MutableStateFlow("")

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    val ethersRs = RnEthersRs(reactContext)
    val viewModel = MnemonicConfirmationViewModel(ethersRs)
    return ComposeView(reactContext).apply {
      id = R.id.mnemonic_confirmation_compose_id // Needed for RN event emitter

      setContent {
        val mnemonicId by mnemonicIdFlow.collectAsState()

        UniswapComponent {
          MnemonicConfirmation(mnemonicId = mnemonicId, viewModel = viewModel) {
            val reactContext = context as ReactContext
            reactContext
              .getJSModule(RCTEventEmitter::class.java)
              .receiveEvent(id, EVENT_COMPLETED, null) // Sends event to RN bridge
          }
        }
      }
    }
  }

  /**
   * Maps local event name to expected RN prop. See RN [ViewManager] docs on github for schema.
   * Using bubbling instead of direct events because overriding
   * getExportedCustomDirectEventTypeConstants leads to a component not found error for some reason.
   * Direct events will try find callback prop on native component, and bubbled events will bubble
   * up until it finds component with the right callback prop.
   */
  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> {
    return mapOf(
      EVENT_COMPLETED to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to EVENT_COMPLETED)
      )
    )
  }

  @ReactProp(name = "mnemonicId")
  fun setMnemonicId(view: View, mnemonicId: String) {
    mnemonicIdFlow.update { mnemonicId }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicConfirmation"
    private const val EVENT_COMPLETED = "onConfirmComplete"
  }
}

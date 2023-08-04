package com.uniswap.onboarding

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.uniswap.R
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
      id = R.id.mnemonic_confirmation_compose_id // Needed for RN event emitter

      setContent {
        UniswapComponent {
          // TODO gary replace with mock words or real data and phrase testing functionality
          Column {
            MnemonicConfirmation(sourceWords = MOCK_WORDS) {
              val reactContext = context as ReactContext
              reactContext
                .getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, EVENT_COMPLETED, null) // Sends event to event emitter
            }
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

  companion object {
    private const val REACT_CLASS = "MnemonicTest"
    private const val EVENT_COMPLETED = "onTestComplete"
  }
}

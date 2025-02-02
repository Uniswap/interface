package com.uniswap.onboarding.backup

import android.view.View
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
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

  private lateinit var context: ThemedReactContext

  private val mnemonicIdFlow = MutableStateFlow("")
  private val copyTextFlow = MutableStateFlow("")
  private val copiedTextFlow = MutableStateFlow("")

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    context = reactContext
    val ethersRs = RnEthersRs(reactContext)
    val viewModel = MnemonicDisplayViewModel(ethersRs)

    return ComposeView(reactContext).apply {
      setContent {
        val mnemonicId by mnemonicIdFlow.collectAsState()
        val copyText by copyTextFlow.collectAsState()
        val copiedText by copiedTextFlow.collectAsState()

        UniswapComponent {
          MnemonicDisplay(
            mnemonicId = mnemonicId,
            viewModel = viewModel,
            copyText = copyText,
            copiedText = copiedText,
            onHeightMeasured = {
              val bundle = Arguments.createMap().apply {
                putDouble(FIELD_HEIGHT, it.toDouble())
              }
              sendEvent(id, EVENT_HEIGHT_MEASURED, bundle)
            },
            onEmptyMnemonic = {
              val bundle = Arguments.createMap().apply {
                putString("mnemonicId", it)
              }
              sendEvent(id, EVENT_EMPTY_MNEMONIC, bundle)
            }
          )
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
      EVENT_HEIGHT_MEASURED to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_HEIGHT_MEASURED,
          "captured" to EVENT_HEIGHT_MEASURED
        )
      ),
      EVENT_EMPTY_MNEMONIC to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_EMPTY_MNEMONIC,
          "captured" to EVENT_EMPTY_MNEMONIC
        )
      )
    )
  }

  private fun sendEvent(id: Int, eventName: String, bundle: WritableMap? = null) {
    context
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, eventName, bundle)
  }

  @ReactProp(name = "mnemonicId")
  fun setMnemonicId(view: View, mnemonicId: String) {
    mnemonicIdFlow.update { mnemonicId }
  }

  @ReactProp(name = "copyText")
  fun setCopyText(view: View, copyText: String) {
    copyTextFlow.update { copyText }
  }

  @ReactProp(name = "copiedText")
  fun setCopiedText(view: View, copiedText: String) {
    copiedTextFlow.update { copiedText }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicDisplay"
    private const val EVENT_HEIGHT_MEASURED = "onHeightMeasured"
    private const val EVENT_EMPTY_MNEMONIC = "onEmptyMnemonic"
    private const val FIELD_HEIGHT = "height"
  }
}

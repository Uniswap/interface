package com.uniswap.onboarding.privatekeys

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
import com.uniswap.theme.UniswapComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update

/**
 * View manager used to import native component into React Native code
 * for the PrivateKeyDisplay which shows the private key for the given
 * address and enabled copying it to clipboard.
 */
class PrivateKeyDisplayViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  private lateinit var context: ThemedReactContext

  private val addressFlow = MutableStateFlow("")

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    context = reactContext
    val ethersRs = RnEthersRs(reactContext)
    val viewModel = PrivateKeyDisplayViewModel(ethersRs)

    return ComposeView(reactContext).apply {
      setContent {
        val address by addressFlow.collectAsState()

        UniswapComponent {
          PrivateKeyDisplay(
            address = address,
            viewModel = viewModel,
            onHeightMeasured = {
              val bundle = Arguments.createMap().apply {
                putDouble(FIELD_HEIGHT, it.toDouble())
              }
              sendEvent(id, EVENT_HEIGHT_MEASURED, bundle)
            },
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
    )
  }

  private fun sendEvent(id: Int, eventName: String, bundle: WritableMap? = null) {
    context
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, eventName, bundle)
  }

  @ReactProp(name = "address")
  fun setAddress(view: View, mnemonicId: String) {
    addressFlow.update { mnemonicId }
  }

  companion object {
    private const val REACT_CLASS = "PrivateKeyDisplay"
    private const val EVENT_HEIGHT_MEASURED = "onHeightMeasured"
    private const val FIELD_HEIGHT = "height"
  }
}

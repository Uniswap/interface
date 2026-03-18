package com.uniswap.onboarding.import

import android.view.View
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalDensity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.uniswap.R
import com.uniswap.RnEthersRs
import com.uniswap.theme.UniswapComponent
import kotlinx.coroutines.flow.MutableStateFlow


/**
 * View manager used to import native component into React Native code
 * for the MnemonicDisplay component used to show the seed phrases
 */
class SeedPhraseInputViewManager : ViewGroupManager<ComposeView>() {

  override fun getName(): String = REACT_CLASS

  private lateinit var viewModel: SeedPhraseInputViewModel
  private lateinit var context: ThemedReactContext

  private var rnStrings = MutableStateFlow(emptyMap<String, String>())

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeView {
    context = reactContext
    val ethersRs = RnEthersRs(reactContext)

    return ComposeView(reactContext).apply {
      id = R.id.seed_phrase_input_compose_id
      viewModel = SeedPhraseInputViewModel(
        ethersRs,
        onInputValidated = {
          val bundle = Arguments.createMap().apply {
            putBoolean(FIELD_CAN_SUBMIT, it)
          }
          sendEvent(id, EVENT_INPUT_VALIDATED, bundle)
        },
        onMnemonicStored = {
          val bundle = Arguments.createMap().apply {
            putString(FIELD_MNEMONIC_ID, it)
          }
          sendEvent(id, EVENT_MNEMONIC_STORED, bundle)
        },
        onSubmitError = {
          sendEvent(id, EVENT_SUBMIT_ERROR)
        }
      )

      setContent {
        val density = LocalDensity.current.density

        BoxWithConstraints {
          UniswapComponent(
            modifier = Modifier
              .fillMaxWidth()
              .wrapContentHeight(unbounded = true)
              .align(Alignment.TopCenter)
              .onSizeChanged {
                val bundle = Arguments
                  .createMap()
                  .apply {
                    putDouble(FIELD_HEIGHT, it.height.toDouble() / density)
                  }
                sendEvent(id, EVENT_HEIGHT_MEASURED, bundle)
              }) {
            SeedPhraseInput(viewModel)
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
      EVENT_INPUT_VALIDATED to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_INPUT_VALIDATED,
          "captured" to EVENT_INPUT_VALIDATED
        )
      ),
      EVENT_MNEMONIC_STORED to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_MNEMONIC_STORED,
          "captured" to EVENT_MNEMONIC_STORED
        )
      ),
      EVENT_HEIGHT_MEASURED to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_HEIGHT_MEASURED,
          "captured" to EVENT_HEIGHT_MEASURED
        )
      ),
      EVENT_SUBMIT_ERROR to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to EVENT_SUBMIT_ERROR,
          "captured" to EVENT_SUBMIT_ERROR
        )
      ),
    )
  }

  private fun sendEvent(id: Int, eventName: String, bundle: WritableMap? = null) {
    context
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, eventName, bundle)
  }

  override fun receiveCommand(root: ComposeView, commandId: String?, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    when (commandId) {
      COMMAND_HANDLE_SUBMIT -> {
        viewModel.handleSubmit()
      }
      COMMAND_FOCUS -> {
        viewModel.focus()
      }
      COMMAND_BLUR -> {
        viewModel.blur()
      }
      else -> Unit
    }
  }

  @ReactProp(name = "targetMnemonicId")
  fun setTargetMnemonicId(view: View, mnemonicId: String?) {
    viewModel.targetMnemonicId = mnemonicId
  }

  @ReactProp(name = "strings")
  fun setStrings(view: View, strings: ReadableMap) {
    viewModel.rnStrings = SeedPhraseInputViewModel.ReactNativeStrings(
      inputPlaceholder = strings.getString("inputPlaceholder") ?: "",
      pasteButton = strings.getString("pasteButton") ?: "",
      errorInvalidWord = strings.getString("errorInvalidWord") ?: "",
      errorPhraseLength = strings.getString("errorPhraseLength") ?: "",
      errorWrongPhrase = strings.getString("errorWrongPhrase") ?: "",
      errorInvalidPhrase = strings.getString("errorInvalidPhrase") ?: "",
      errorWordIsAddress = strings.getString("errorWordIsAddress") ?: "",
    )
  }

  companion object {
    private const val REACT_CLASS = "SeedPhraseInput"
    private const val EVENT_INPUT_VALIDATED = "onInputValidated"
    private const val EVENT_MNEMONIC_STORED = "onMnemonicStored"
    private const val EVENT_HEIGHT_MEASURED = "onHeightMeasured"
    private const val EVENT_SUBMIT_ERROR = "onSubmitError"
    private const val COMMAND_HANDLE_SUBMIT = "handleSubmit"
    private const val COMMAND_FOCUS = "focus"
    private const val COMMAND_BLUR = "blur"
    private const val FIELD_MNEMONIC_ID = "mnemonicId"
    private const val FIELD_CAN_SUBMIT = "canSubmit"
    private const val FIELD_HEIGHT = "height"
  }
}

package com.uniswap.onboarding.import

import android.view.View
import android.view.ViewGroup.LayoutParams
import androidx.annotation.IdRes
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.core.view.updateLayoutParams
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.uniswap.R
import com.uniswap.RnEthersRs
import com.uniswap.theme.UniswapComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.serialization.json.Json


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
        onInputValidated =  {
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
        }
      )

      setContent {
        UniswapComponent {
          SeedPhraseInput(
            viewModel,
            onHelpTextPress = {
              sendEvent(id, EVENT_HELP_TEXT_PRESS, null)
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
      EVENT_HELP_TEXT_PRESS to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to EVENT_HELP_TEXT_PRESS, "captured" to EVENT_HELP_TEXT_PRESS)
      ),
      EVENT_INPUT_VALIDATED to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to EVENT_INPUT_VALIDATED, "captured" to EVENT_INPUT_VALIDATED)
      ),
      EVENT_MNEMONIC_STORED to mapOf(
        "phasedRegistrationNames" to mapOf("bubbled" to EVENT_MNEMONIC_STORED, "captured" to EVENT_MNEMONIC_STORED)
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
      COMMAND_HANDLE_SUBMIT -> viewModel.handleSubmit()
      else -> Unit
    }
  }

  @ReactProp(name = "mnemonicIdForRecovery")
  fun setMnemonicIdForRecovery(view: View, mnemonicId: String?) {
    viewModel.mnemonicIdForRecovery = mnemonicId
  }

  @ReactProp(name = "strings")
  fun setStrings(view: View, strings: ReadableMap) {
    viewModel.rnStrings = SeedPhraseInputViewModel.ReactNativeStrings(
      helpText = strings.getString("helpText") ?: "",
      inputPlaceholder = strings.getString("inputPlaceholder") ?: "",
      pasteButton = strings.getString("pasteButton") ?: "",
      errorInvalidWord = strings.getString("errorInvalidWord") ?: "",
      errorPhraseLength = strings.getString("errorPhraseLength") ?: "",
      errorWrongPhrase = strings.getString("errorWrongPhrase") ?: "",
      errorInvalidPhrase = strings.getString("errorInvalidPhrase") ?: "",
    )
  }

  companion object {
    private const val REACT_CLASS = "SeedPhraseInput"
    private const val EVENT_HELP_TEXT_PRESS = "onHelpTextPress"
    private const val EVENT_INPUT_VALIDATED = "onInputValidated"
    private const val EVENT_MNEMONIC_STORED = "onMnemonicStored"
    private const val COMMAND_HANDLE_SUBMIT = "handleSubmit"
    private const val FIELD_MNEMONIC_ID = "mnemonicId"
    private const val FIELD_CAN_SUBMIT = "canSubmit"
  }
}

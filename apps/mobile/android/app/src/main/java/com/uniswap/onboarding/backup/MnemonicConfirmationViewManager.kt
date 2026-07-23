package com.uniswap.onboarding.backup

import android.view.View
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.uniswap.R
import com.uniswap.RnEthersRs
import com.uniswap.compose.ComposeHostView
import com.uniswap.compose.dispatchComposeHostEvent
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
class MnemonicConfirmationViewManager : ViewGroupManager<ComposeHostView>() {

  override fun getName(): String = REACT_CLASS

  private val mnemonicIdFlow = MutableStateFlow("")
  private val shouldShowSmallTextFlow = MutableStateFlow(false)
  private val selectedWordPlaceholderFlow = MutableStateFlow("")
  private val pageStartFlow = MutableStateFlow(0)
  private val pageSizeFlow = MutableStateFlow(0)
  private val currentPageFlow = MutableStateFlow(0)
  private val totalPagesFlow = MutableStateFlow(0)

  override fun createViewInstance(reactContext: ThemedReactContext): ComposeHostView {
    val ethersRs = RnEthersRs(reactContext)
    val viewModel = MnemonicConfirmationViewModel(ethersRs)

    val host = ComposeHostView(reactContext).apply {
      id = R.id.mnemonic_confirmation_compose_id // Needed for RN event emitter
    }

    val composeView = ComposeView(reactContext).apply {
      setContent {
        val mnemonicId by mnemonicIdFlow.collectAsState()
        val shouldShowSmallText by shouldShowSmallTextFlow.collectAsState()
        val selectedWordPlaceholder by selectedWordPlaceholderFlow.collectAsState()
        val pageStart by pageStartFlow.collectAsState()
        val pageSize by pageSizeFlow.collectAsState()
        val currentPage by currentPageFlow.collectAsState()
        val totalPages by totalPagesFlow.collectAsState()

        viewModel.updatePlaceholder(selectedWordPlaceholder)

        UniswapComponent {
          MnemonicConfirmation(
            mnemonicId = mnemonicId,
            viewModel = viewModel,
            shouldShowSmallText = shouldShowSmallText,
            pageStart = pageStart,
            pageSize = pageSize,
            currentPage = currentPage,
            totalPages = totalPages,
          ) {
            dispatchComposeHostEvent(reactContext, host.id, EVENT_COMPLETED) // Sends event to RN bridge
          }
        }
      }
    }

    host.setComposeView(composeView)
    return host
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

  @ReactProp(name = "shouldShowSmallText")
  fun setShouldShowSmallText(view: View, shouldShowSmallText: Boolean) {
    shouldShowSmallTextFlow.update { shouldShowSmallText }
  }

  @ReactProp(name = "selectedWordPlaceholder")
  fun setSelectedWordPlaceholder(view: View, selectedWordPlaceholder: String) {
    selectedWordPlaceholderFlow.update { selectedWordPlaceholder }
  }

  @ReactProp(name = "pageStart", defaultInt = 0)
  fun setPageStart(view: View, pageStart: Int) {
    pageStartFlow.update { pageStart }
  }

  @ReactProp(name = "pageSize", defaultInt = 0)
  fun setPageSize(view: View, pageSize: Int) {
    pageSizeFlow.update { pageSize }
  }

  @ReactProp(name = "currentPage", defaultInt = 0)
  fun setCurrentPage(view: View, currentPage: Int) {
    currentPageFlow.update { currentPage }
  }

  @ReactProp(name = "totalPages", defaultInt = 0)
  fun setTotalPages(view: View, totalPages: Int) {
    totalPagesFlow.update { totalPages }
  }

  companion object {
    private const val REACT_CLASS = "MnemonicConfirmation"
    private const val EVENT_COMPLETED = "onConfirmComplete"
  }
}

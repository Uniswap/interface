package com.uniswap.onboarding.ui

import androidx.lifecycle.ViewModel
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class MnemonicDisplayViewModel(
  private val ethersRs: RnEthersRs // Move to repository layer if app gets more complex
) : ViewModel() {

  private val _words = MutableStateFlow<List<MnemonicWordUiState>>(emptyList())
  val words = _words.asStateFlow()

  private var currentMnemonicId = ""

  fun setup(mnemonicId: String) {
    if (mnemonicId.isNotEmpty() && mnemonicId != currentMnemonicId) {
      currentMnemonicId = mnemonicId

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        _words.update {
          mnemonic.split(" ").map { phrase ->
            MnemonicWordUiState(phrase)
          }
        }
      }
    }
  }
}

package com.uniswap.onboarding.backup.ui

import androidx.lifecycle.ViewModel
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class MnemonicDisplayViewModel(
  private val ethersRs: RnEthersRs // Move to repository layer if app gets more complex
) : ViewModel() {
  private val defaultMnemonicsCount = 12
  private val _words =
    MutableStateFlow(List(defaultMnemonicsCount) { MnemonicWordUiState(num = it + 1, text = "") })
  val words = _words.asStateFlow()

  private var currentMnemonicId = ""

  fun setup(mnemonicId: String) {
    if (mnemonicId.isNotEmpty() && mnemonicId != currentMnemonicId) {
      currentMnemonicId = mnemonicId
      reset()

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        val phraseList = mnemonic.split(" ")
        _words.update {
          phraseList.mapIndexed { index, phrase ->
            MnemonicWordUiState(
              num = index + 1,
              text = phrase,
            )
          }
        }
      }
    }
  }

  private fun reset() {
    _words.update { emptyList() }
  }
}

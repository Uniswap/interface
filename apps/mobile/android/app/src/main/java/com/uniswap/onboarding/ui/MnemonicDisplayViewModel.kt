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

  // Displays simple UI when phrase is too large
  private val _longPhrase = MutableStateFlow("")
  val longPhrase = _longPhrase.asStateFlow()

  private var currentMnemonicId = ""

  fun setup(mnemonicId: String) {
    if (mnemonicId.isNotEmpty() && mnemonicId != currentMnemonicId) {
      currentMnemonicId = mnemonicId
      reset()

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        val phraseList = mnemonic.split(" ")
        if (phraseList.size > PHRASE_SIZE_MAX) {
          _longPhrase.update { mnemonic }
        } else {
          _words.update {
            phraseList.map { phrase ->
              MnemonicWordUiState(phrase)
            }
          }
        }
      }
    }
  }

  private fun reset() {
    _words.update { emptyList() }
    _longPhrase.update { "" }
  }

  companion object {
     private const val PHRASE_SIZE_MAX = 12
  }
}

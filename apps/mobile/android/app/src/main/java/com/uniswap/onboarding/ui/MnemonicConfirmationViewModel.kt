package com.uniswap.onboarding.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uniswap.onboarding.ui.model.MnemonicWordBankCellUiState
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import javax.inject.Inject

@HiltViewModel
class MnemonicConfirmationViewModel @Inject constructor() : ViewModel() {

  private var sourceWords = emptyList<String>()
  private var shuffledWords = emptyList<String>()
  private val focusedIndex = MutableStateFlow(0)
  private val selectedWords = MutableStateFlow<List<String?>>(emptyList())

  val displayWords: StateFlow<List<MnemonicWordUiState>> = combine(focusedIndex, selectedWords) { focusedIndexValue, words ->
    words.mapIndexed { index, word ->
      MnemonicWordUiState(
        text = word ?: "",
        focused = index == focusedIndexValue,
        hasError = word != null && word != sourceWords[index],
      )
    }
  }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  val wordBankList: StateFlow<List<MnemonicWordBankCellUiState>> = combine(focusedIndex, selectedWords) { focusedIndexValue, words ->
    shuffledWords.map { shuffledWord ->
      MnemonicWordBankCellUiState(
        text = shuffledWord,
        used = words.contains(shuffledWord),
      )
    }
  }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  fun setup(words: List<String>) {
    sourceWords = words
    shuffledWords = words.shuffled()
    focusedIndex.update { 0 }
    selectedWords.update { List(words.size) { null } }
  }

  fun handleWordRowClick(word: MnemonicWordUiState) {
    val index = displayWords.value.indexOf(word)
    focusedIndex.update { index }
  }

  fun handleWordBankClick(state: MnemonicWordBankCellUiState) {
    if (!state.used) {
      val focusedIndexValue = focusedIndex.value
      selectedWords.update { words ->
        words.mapIndexed { index, word ->
          if (index == focusedIndexValue) {
            if (state.text == sourceWords[focusedIndexValue]) {
              focusedIndex.update { focusedIndexValue + 1 }
            }
            state.text
          } else {
            word
          }
        }
      }
    }
  }
}

package com.uniswap.onboarding.backup.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.backup.ui.model.MnemonicInputStatus
import com.uniswap.onboarding.backup.ui.model.MnemonicWordBankCellUiState
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

class MnemonicConfirmationViewModel(
  private val ethersRs: RnEthersRs, // Move to repository layer if app gets more complex
) : ViewModel() {
  private val defaultMnemonicsCount = 12

  private var sourceWords = List(defaultMnemonicsCount) { "" }
  private var shuffledWords = emptyList<String>()
  private val focusedIndex = MutableStateFlow(0)
  private val selectedWordsIndexes =
    MutableStateFlow<List<Int?>>(List(defaultMnemonicsCount) { null })
  private val selectedWordPlaceholderFlow = MutableStateFlow("")

  val selectedWords: StateFlow<List<MnemonicWordUiState>> =
    selectedWordsIndexes.combine(selectedWordPlaceholderFlow) { _, placeholder ->
      List(sourceWords.size) { index ->
        getMnemonicWordUiState(index, placeholder)
      }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  val wordBankList: StateFlow<List<MnemonicWordBankCellUiState>> =
    selectedWordsIndexes.map { selectedWordsIndexes ->
      shuffledWords.mapIndexed { index, word ->
        MnemonicWordBankCellUiState(
          index = index,
          text = word,
          used = selectedWordsIndexes.contains(index),
        )
      }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

  private val _completed = MutableStateFlow(false)
  val completed = _completed.asStateFlow()

  private var currentMnemonicId = ""

  fun setup(mnemonicId: String) {
    if (mnemonicId.isNotEmpty() && mnemonicId != currentMnemonicId) {
      currentMnemonicId = mnemonicId
      reset()

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        val words = mnemonic.split(" ")
        sourceWords = words
        shuffledWords = words.shuffled()
        selectedWordsIndexes.update { List(words.size) { null } }
      }
    }
  }

  private fun reset() {
    sourceWords = List(defaultMnemonicsCount) { "" }
    shuffledWords = emptyList()
    focusedIndex.update { 0 }
    selectedWordsIndexes.update { emptyList() }
    _completed.update { false }
  }

  fun updatePlaceholder(newPlaceholder: String) {
    selectedWordPlaceholderFlow.value = newPlaceholder
  }

  fun handleWordBankClick(wordBankIndex: Int) {
    selectedWordsIndexes.update { indexes ->
      val updatedIndexes = indexes.toMutableList()
      updatedIndexes[focusedIndex.value] = wordBankIndex
      updatedIndexes
    }

    if (focusedIndex.value == sourceWords.size - 1) {
      checkIfCompleted()
    } else if (sourceWords[focusedIndex.value] == shuffledWords[wordBankIndex] && focusedIndex.value < sourceWords.size - 1) {
      focusedIndex.update { it + 1 }
    }
  }

  private fun checkIfCompleted() {
    if (selectedWordsIndexes.value.size != sourceWords.size) {
      return
    }

    for (i in selectedWordsIndexes.value.indices) {
      val selectedWord = getSelectedWord(i)
      if (sourceWords[i].isEmpty() || selectedWord != sourceWords[i]) {
        return
      }
    }

    _completed.update { true }
  }

  private fun getSelectedWord(displayIndex: Int): String {
    return selectedWordsIndexes.value.getOrNull(displayIndex)?.let { shuffledWords.getOrNull(it) }
      ?: ""
  }

  private fun getMnemonicWordUiState(
    displayIndex: Int,
    placeholderText: String
  ): MnemonicWordUiState {
    val selectedWord = getSelectedWord(displayIndex)
    var status = MnemonicInputStatus.CORRECT_INPUT

    if (selectedWord.isEmpty()) {
      status = MnemonicInputStatus.NO_INPUT
    } else if (selectedWord != sourceWords[displayIndex]) {
      status = MnemonicInputStatus.WRONG_INPUT
    }

    return MnemonicWordUiState(
      num = displayIndex + 1,
      text = selectedWord.ifEmpty { placeholderText },
      status = status,
    )
  }
}

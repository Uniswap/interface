package com.uniswap.onboarding.backup.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uniswap.RnEthersRs
import com.uniswap.onboarding.backup.ui.model.MnemonicInputStatus
import com.uniswap.onboarding.backup.ui.model.MnemonicWordBankCellUiState
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import com.uniswap.onboarding.shared.MNEMONIC_LENGTH_HD
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
  private var sourceWords = List(MNEMONIC_LENGTH_HD) { "" }
  private var shuffledWords = emptyList<String>()
  private val focusedIndex = MutableStateFlow(0)
  private val selectedWordsIndexes =
    MutableStateFlow<List<Int?>>(List(MNEMONIC_LENGTH_HD) { null })
  private val selectedWordPlaceholderFlow = MutableStateFlow("")

  val selectedWords: StateFlow<List<MnemonicWordUiState>> =
    combine(selectedWordsIndexes, selectedWordPlaceholderFlow, focusedIndex) { _, placeholder, focusedIndex ->
      List(sourceWords.size) { index ->
        getMnemonicWordUiState(index, placeholder, focusedIndex)
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
  // Pagination: when pageSize > 0, the view confirms only words[pageStart..<pageStart+pageSize].
  // pageSize == 0 means "use the full mnemonic" (single-page mode, default).
  private var pageStart: Int = 0
  private var pageSize: Int = 0

  fun setup(mnemonicId: String, pageStart: Int = 0, pageSize: Int = 0) {
    val configChanged = mnemonicId != currentMnemonicId ||
      pageStart != this.pageStart ||
      pageSize != this.pageSize
    if (mnemonicId.isNotEmpty() && configChanged) {
      currentMnemonicId = mnemonicId
      this.pageStart = pageStart
      this.pageSize = pageSize
      reset()

      ethersRs.retrieveMnemonic(mnemonicId)?.let { mnemonic ->
        val allWords = mnemonic.split(" ")
        val effectiveSize = if (pageSize > 0) pageSize else allWords.size
        val start = pageStart.coerceAtLeast(0)
        val end = (start + effectiveSize).coerceAtMost(allWords.size)
        val slice = if (end > start) allWords.subList(start, end) else emptyList()
        sourceWords = slice
        shuffledWords = slice.shuffled()
        selectedWordsIndexes.update { List(slice.size) { null } }
      }
    }
  }

  private fun reset() {
    sourceWords = emptyList()
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
    placeholderText: String,
    focusedIndex: Int,
  ): MnemonicWordUiState {
    val selectedWord = getSelectedWord(displayIndex)
    var status = MnemonicInputStatus.CORRECT_INPUT

    if (selectedWord.isEmpty()) {
      status = MnemonicInputStatus.NO_INPUT
    } else if (selectedWord != sourceWords[displayIndex]) {
      status = MnemonicInputStatus.WRONG_INPUT
    }

    return MnemonicWordUiState(
      num = pageStart + displayIndex + 1,
      text = selectedWord.ifEmpty { placeholderText },
      status = status,
      isActive = displayIndex == focusedIndex,
    )
  }
}

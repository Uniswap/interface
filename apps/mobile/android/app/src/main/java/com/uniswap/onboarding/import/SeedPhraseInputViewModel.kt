package com.uniswap.onboarding.import

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.toLowerCase
import androidx.lifecycle.ViewModel
import com.uniswap.RnEthersRs

class SeedPhraseInputViewModel(
  private val ethersRs: RnEthersRs,
  wordList: List<String>,
  private val onInputValidated: (canSubmit: Boolean) -> Unit,
  private val onMnemonicStored: (mnemonicId: String) -> Unit,
) : ViewModel() {

  enum class Status {
    None,
    Valid,
    Error,
  }

  sealed interface Error {
    class InvalidWord(val word: String) : Error
    object TooManyWords : Error
    object NotEnoughWords : Error
    object WrongRecoveryPhrase : Error
  }

  private val wordListSet = wordList.toSet()

  // Sourced externally from RN
  var mnemonicIdForRecovery by mutableStateOf<String?>(null)
  var helpText: String by mutableStateOf("")

  var input by mutableStateOf(TextFieldValue(""))
    private set
  var error by mutableStateOf<Error?>(null)
    private set
  var status by mutableStateOf(Status.None)
    private set

  fun handleInputChange(value: TextFieldValue) {
    input = value

    val normalized = normalizeInput(value)
    val skipLastWord = normalized.lastOrNull() != ' '
    val mnemonic = normalized.trim()
    val words = mnemonic.split(" ")

    if (words.isEmpty()) {
      status = Status.None
      return
    }

    val isValidLength = words.size in MIN_LENGTH..MAX_LENGTH
    val firstInvalidMnemonic = findFirstInvalidMnemonic(words)
    if (firstInvalidMnemonic == words.last() && skipLastWord) {
      status = Status.None
    } else if (firstInvalidMnemonic == null && isValidLength) {
      status = Status.Valid
    } else if (firstInvalidMnemonic != null) {
      status = Status.Error
      error = Error.InvalidWord(firstInvalidMnemonic)
    } else {
      status = Status.None
    }

    if (status != Status.Error) {
      error = null
    }

    val canSubmit = error == null && mnemonic != "" && firstInvalidMnemonic == null
    onInputValidated(canSubmit)
  }

  private fun normalizeInput(value: TextFieldValue) =
    value.text.replace("\\s+".toRegex(), " ").lowercase()

  private fun findFirstInvalidMnemonic(words: List<String>): String? {
    for (word in words) {
      if (!wordListSet.contains(word)) {
        return word
      }
    }
    return null
  }

  fun handleSubmit() {
    try {
      val normalized = normalizeInput(input)
      val mnemonic = normalized.trim()
      val words = mnemonic.split(" ")

      if (words.size < MIN_LENGTH) {
        error = Error.NotEnoughWords
      } else if (words.size > MAX_LENGTH) {
        error = Error.TooManyWords
      } else {
        submitMnemonic(mnemonic)
      }
    } catch (e: Exception) {
      // TODO gary add production logging and update rust code to convert to Java exceptions
      Log.d("SeedPhraseInputViewModel", "Storing mnemonic caused error ${e.message}")
    }
  }

  private fun submitMnemonic(mnemonic: String) {
    if (mnemonicIdForRecovery != null) {
      val generatedId = ethersRs.generateAddressForMnemonic(mnemonic, derivationIndex = 0)
      if (generatedId != mnemonicIdForRecovery) {
        error = Error.WrongRecoveryPhrase
      } else {
        storeMnemonic(mnemonic)
      }
    } else {
      storeMnemonic(mnemonic)
    }
  }

  private fun storeMnemonic(mnemonic: String) {
    val mnemonicId = ethersRs.importMnemonic(mnemonic)
    onMnemonicStored(mnemonicId)
  }

  companion object {
    private const val MIN_LENGTH = 12
    private const val MAX_LENGTH = 24
  }
}

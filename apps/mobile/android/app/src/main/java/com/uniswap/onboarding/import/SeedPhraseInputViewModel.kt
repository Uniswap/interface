package com.uniswap.onboarding.import

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.toLowerCase
import androidx.lifecycle.ViewModel
import com.uniswap.EthersRs
import com.uniswap.RnEthersRs

class SeedPhraseInputViewModel(
  private val ethersRs: RnEthersRs,
  private val onInputValidated: (canSubmit: Boolean) -> Unit,
  private val onMnemonicStored: (mnemonicId: String) -> Unit,
) : ViewModel() {

  sealed interface Status {
    object None: Status
    object Valid: Status
    class Error(val error: MnemonicError): Status
  }

  sealed interface MnemonicError {
    class InvalidWord(val word: String) : MnemonicError
    object TooManyWords : MnemonicError
    object NotEnoughWords : MnemonicError
    object WrongRecoveryPhrase : MnemonicError
    object InvalidPhrase: MnemonicError
  }

  data class ReactNativeStrings(
    val helpText: String,
    val inputPlaceholder: String,
    val pasteButton: String,
    val errorInvalidWord: String,
    val errorPhraseLength: String,
    val errorWrongPhrase: String,
    val errorInvalidPhrase: String,
  )

  // Sourced externally from RN
  var mnemonicIdForRecovery by mutableStateOf<String?>(null)
  var rnStrings by mutableStateOf(ReactNativeStrings(
    helpText = "",
    inputPlaceholder = "",
    pasteButton = "",
    errorInvalidWord = "",
    errorPhraseLength = "",
    errorWrongPhrase = "",
    errorInvalidPhrase = "",
  ))

  var input by mutableStateOf(TextFieldValue(""))
    private set
  var status by mutableStateOf<Status>(Status.None)
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
    val firstInvalidWord = EthersRs.findInvalidWord(mnemonic)
    if (firstInvalidWord == words.last() && skipLastWord) {
      status = Status.None
    } else if (firstInvalidWord.isEmpty() && isValidLength) {
      status = Status.Valid
    } else if (firstInvalidWord.isNotEmpty()) {
      status = Status.Error(MnemonicError.InvalidWord(firstInvalidWord))
    } else {
      status = Status.None
    }

    val canSubmit = status !is Status.Error && mnemonic != "" && firstInvalidWord.isEmpty()
    onInputValidated(canSubmit)
  }

  private fun normalizeInput(value: TextFieldValue) =
    value.text.replace("\\s+".toRegex(), " ").lowercase()

  fun handleSubmit() {
    try {
      val normalized = normalizeInput(input)
      val mnemonic = normalized.trim()
      val words = mnemonic.split(" ")
      val valid = EthersRs.validateMnemonic(mnemonic)

      if (words.size < MIN_LENGTH) {
        status = Status.Error(MnemonicError.NotEnoughWords)
      } else if (words.size > MAX_LENGTH) {
        status = Status.Error(MnemonicError.TooManyWords)
      } else if (!valid) {
        status = Status.Error(MnemonicError.InvalidPhrase)
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
        status = Status.Error(MnemonicError.WrongRecoveryPhrase)
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

package com.uniswap.onboarding.import

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.TextFieldValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uniswap.EthersRs
import com.uniswap.RnEthersRs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class SeedPhraseInputViewModel(
  private val ethersRs: RnEthersRs,
  private val onInputValidated: (canSubmit: Boolean) -> Unit,
  private val onMnemonicStored: (mnemonicId: String) -> Unit,
  private val onSubmitError: () -> Unit,
) : ViewModel() {

  sealed interface Status {
    object None : Status
    object Valid : Status
    class Error(val error: MnemonicError) : Status
  }

  sealed interface MnemonicError {
    class InvalidWord(val word: String) : MnemonicError
    object TooManyWords : MnemonicError
    object NotEnoughWords : MnemonicError
    object WrongRecoveryPhrase : MnemonicError
    object InvalidPhrase : MnemonicError
    object WordIsAddress : MnemonicError
  }

  data class ReactNativeStrings(
    val inputPlaceholder: String,
    val pasteButton: String,
    val errorInvalidWord: String,
    val errorPhraseLength: String,
    val errorWrongPhrase: String,
    val errorInvalidPhrase: String,
    val errorWordIsAddress: String,
  )

  // Sourced externally from RN
  var targetMnemonicId by mutableStateOf<String?>(null)
  var rnStrings by mutableStateOf(
    ReactNativeStrings(
      inputPlaceholder = "",
      pasteButton = "",
      errorInvalidWord = "",
      errorPhraseLength = "",
      errorWrongPhrase = "",
      errorInvalidPhrase = "",
      errorWordIsAddress = "",
    )
  )

  var input by mutableStateOf(TextFieldValue(""))
    private set
  var status by mutableStateOf<Status>(Status.None)
    private set
  private var validateLastWordTimeout: Long = 1000
  private var validateLastWordJob: Job? = null

  var isFocused by mutableStateOf(false)
    private set

  fun focus() {
    isFocused = true
  }

  fun blur() {
    isFocused = false
  }

  fun handleInputChange(value: TextFieldValue) {
    input = value
    val normalized = normalizeInput(value)

    val skipLastWord = normalized.lastOrNull() != ' '
    val skipInvalidWord = skipLastWord && !isAddress(normalized)
    validateInput(normalized, skipInvalidWord)

    validateLastWordJob?.cancel()

    validateLastWordJob = viewModelScope.launch(Dispatchers.Default) {
      delay(validateLastWordTimeout)
      validateInput(normalized, false)
    }
  }

  private fun validateInput(normalizedInput: String, skipInvalidWord: Boolean) {
    val mnemonic = normalizedInput.trim()
    val words = mnemonic.split(" ")

    if (words.isEmpty()) {
      status = Status.None
      return
    }

    val isValidLength = words.size in MIN_LENGTH..MAX_LENGTH
    val firstInvalidWord = EthersRs.findInvalidWord(mnemonic)

    status = if (firstInvalidWord == words.last() && skipInvalidWord) {
      Status.None
    } else if (firstInvalidWord.isEmpty() && isValidLength) {
      Status.Valid
    } else if (isAddress(mnemonic)) {
      Status.Error(MnemonicError.WordIsAddress)
    } else if (firstInvalidWord.isNotEmpty()) {
      Status.Error(MnemonicError.InvalidWord(firstInvalidWord))
    } else {
      Status.None
    }

    val canSubmit = status !is Status.Error && mnemonic != "" && firstInvalidWord.isEmpty()
    onInputValidated(canSubmit)
  }

  private fun normalizeInput(value: TextFieldValue) =
    value.text.replace("\\s+".toRegex(), " ").lowercase()

  private fun isAddress(value: String) = value.startsWith("0x") && value.length == 42

  fun handleSubmit() {
    validateLastWordJob?.cancel()

    try {
      val normalized = normalizeInput(input)
      val mnemonic = normalized.trim()
      val words = mnemonic.split(" ")
      val valid = EthersRs.validateMnemonic(mnemonic)

      if (words.size < MIN_LENGTH || words.size in MIN_LENGTH + 1..<MAX_LENGTH) {
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

    if (status is Status.Error) {
      onInputValidated(false)
      onSubmitError()
    }
  }

  private fun submitMnemonic(mnemonic: String) {
    if (targetMnemonicId != null) {
      val generatedId = ethersRs.generateAddressForMnemonic(mnemonic, derivationIndex = 0)
      if (generatedId != targetMnemonicId) {
        status = Status.Error(MnemonicError.WrongRecoveryPhrase)
        onSubmitError()
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

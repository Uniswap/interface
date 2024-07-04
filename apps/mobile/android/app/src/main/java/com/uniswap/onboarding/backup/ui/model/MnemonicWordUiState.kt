package com.uniswap.onboarding.backup.ui.model

enum class MnemonicInputStatus {
  NO_INPUT,
  CORRECT_INPUT,
  WRONG_INPUT
}

data class MnemonicWordUiState(
  val num: Int,
  val text: String,
  val status: MnemonicInputStatus = MnemonicInputStatus.CORRECT_INPUT
)

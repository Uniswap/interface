package com.uniswap.onboarding.backup.ui.model

data class MnemonicWordBankCellUiState(
  val index: Int,
  val text: String,
  val used: Boolean = false,
)

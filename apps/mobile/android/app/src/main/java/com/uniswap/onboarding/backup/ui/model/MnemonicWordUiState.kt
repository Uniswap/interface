package com.uniswap.onboarding.backup.ui.model

data class MnemonicWordUiState(
  val num: Int,
  val text: String,
  val focused: Boolean = false,
  val hasError: Boolean = false,
  val sourceIndex: Int? = null,
)

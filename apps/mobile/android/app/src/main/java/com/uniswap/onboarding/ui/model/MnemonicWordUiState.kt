package com.uniswap.onboarding.ui.model

data class MnemonicWordUiState(
  val text: String,
  val focused: Boolean = false,
  val hasError: Boolean = false,
)

package com.uniswap.onboarding.ui.model

data class MnemonicWordUiState(
  val num: Int,
  val text: String,
  val focused: Boolean = false,
  val hasError: Boolean = false,
)

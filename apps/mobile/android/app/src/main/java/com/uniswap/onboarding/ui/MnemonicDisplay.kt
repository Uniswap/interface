package com.uniswap.onboarding.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

@Composable
fun MnemonicDisplay(
  viewModel: MnemonicDisplayViewModel,
  mnemonicId: String,
) {

  val words by viewModel.words.collectAsState()

  LaunchedEffect(mnemonicId) {
    viewModel.setup(mnemonicId)
  }

  MnemonicWordsGroup(words = words)
}

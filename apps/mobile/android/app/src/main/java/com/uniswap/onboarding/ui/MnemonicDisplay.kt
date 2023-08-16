package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.dp

@Composable
fun MnemonicDisplay(
  viewModel: MnemonicDisplayViewModel,
  mnemonicId: String,
) {

  val words by viewModel.words.collectAsState()
  val longPhrase by viewModel.longPhrase.collectAsState()

  LaunchedEffect(mnemonicId) {
    viewModel.setup(mnemonicId)
  }

  BoxWithConstraints {
    val showCompact = maxHeight < SCREEN_HEIGHT_BREAKPOINT.dp

    if (longPhrase.isNotBlank()) {
      MnemonicLongPhraseGroup(longPhrase)
    } else {
      MnemonicWordsGroup(words = words, showCompact = showCompact)
    }
  }
}

private const val SCREEN_HEIGHT_BREAKPOINT = 347

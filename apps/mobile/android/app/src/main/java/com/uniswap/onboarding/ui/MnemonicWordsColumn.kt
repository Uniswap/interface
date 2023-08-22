package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.uniswap.onboarding.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a numbered column of words as part of an overall seed phrase
 */
@Composable
fun MnemonicWordsColumn(
  modifier: Modifier = Modifier,
  words: List<MnemonicWordUiState>,
  showCompact: Boolean = false,
  onClick: (word: MnemonicWordUiState) -> Unit = {},
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(
      if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12
    ),
  ) {
    words.forEachIndexed { index, word ->
      MnemonicWordCell(word = word, showCompact = showCompact) {
        onClick(word)
      }
    }
  }
}

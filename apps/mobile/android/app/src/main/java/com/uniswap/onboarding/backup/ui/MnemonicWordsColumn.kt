package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a numbered column of words as part of an overall seed phrase
 */
@Composable
fun MnemonicWordsColumn(
  modifier: Modifier = Modifier,
  words: List<MnemonicWordUiState>,
  showCompact: Boolean = false,
  onClick: ((word: MnemonicWordUiState) -> Unit)? = null,
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(
      if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12
    ),
  ) {
    words.forEachIndexed { index, word ->

      val onWordClick = onClick?.let {
        { it(word) }
      }
      MnemonicWordCell(word = word, showCompact = showCompact, onClick = onWordClick)
    }
  }
}

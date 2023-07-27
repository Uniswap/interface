package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a numbered column of words as part of an overall seed phrase
 */
@Composable
fun MnemonicWordsColumn(
  modifier: Modifier = Modifier,
  words: List<String>,
  indexOffset: Int,
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(
      UniswapTheme.spacing.spacing12
    ),
  ) {
    words.forEachIndexed { index, word ->
      MnemonicWordCell(index = index + indexOffset, word = word)
    }
  }
}

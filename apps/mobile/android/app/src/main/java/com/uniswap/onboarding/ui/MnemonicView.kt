package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.uniswap.theme.UniswapTheme

/**
 * View used to display mnemonic words for wallet seed phrase
 */
@Composable
fun MnemonicView(
  modifier: Modifier = Modifier,
  words: List<String>,
  columnCount: Int = DEFAULT_COLUMN_COUNT,
) {
  Row(
    modifier = modifier,
    horizontalArrangement = Arrangement.spacedBy(
      UniswapTheme.spacing.spacing12
    )
  ) {
    val size = words.size / columnCount
    for (i in 0 until columnCount) {
      val starting = i * size
      val ending = (i + 1) * size
      MnemonicWordsColumn(
        modifier = Modifier.weight(1f),
        words = words.subList(starting, ending),
        indexOffset = starting + 1
      )
    }
  }
}


private const val DEFAULT_COLUMN_COUNT = 2

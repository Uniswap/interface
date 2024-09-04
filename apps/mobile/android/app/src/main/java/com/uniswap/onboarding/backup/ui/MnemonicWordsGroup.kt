package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * View used to display mnemonic words for wallet seed phrase
 */
@Composable
fun MnemonicWordsGroup(
  modifier: Modifier = Modifier,
  words: List<MnemonicWordUiState>,
  columnCount: Int = DEFAULT_COLUMN_COUNT,
  shouldShowSmallText: Boolean = false,
) {
  Row(
    modifier = modifier
      .fillMaxWidth()
      .wrapContentHeight()
      .background(color = UniswapTheme.colors.surface2, shape = RoundedCornerShape(20.dp))
      .border(
        width = 1.dp,
        color = UniswapTheme.colors.surface3,
        shape = RoundedCornerShape(20.dp),
      )
      .padding(
        vertical = UniswapTheme.spacing.spacing24,
        horizontal = UniswapTheme.spacing.spacing32
      ),
    horizontalArrangement = Arrangement.spacedBy(UniswapTheme.spacing.spacing8)
  ) {
    val size = words.size / columnCount
    for (i in 0 until columnCount) {
      val starting = i * size
      val ending = (i + 1) * size
      MnemonicWordsColumn(
        modifier = Modifier.weight(1f),
        words = words.subList(starting, ending),
        shouldShowSmallText = shouldShowSmallText,
      )
    }
  }
}

private const val DEFAULT_COLUMN_COUNT = 2

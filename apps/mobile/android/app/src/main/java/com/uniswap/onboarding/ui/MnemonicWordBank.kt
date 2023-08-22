package com.uniswap.onboarding.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import com.google.accompanist.flowlayout.FlowRow
import com.google.accompanist.flowlayout.MainAxisAlignment
import com.uniswap.onboarding.ui.model.MnemonicWordBankCellUiState
import com.uniswap.theme.UniswapColors
import com.uniswap.theme.UniswapTheme

/**
 * Used to render a set of clickable mnemonic words
 */
@Composable
fun MnemonicWordBank(
  words: List<MnemonicWordBankCellUiState>,
  showCompact: Boolean = false,
  onClick: (word: MnemonicWordBankCellUiState) -> Unit
) {
  FlowRow(
    modifier = Modifier
      .fillMaxWidth()
      .wrapContentHeight(),
    mainAxisSpacing = if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12,
    crossAxisSpacing = if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12,
    mainAxisAlignment = MainAxisAlignment.Center,
  ) {
    words.forEach {
      MnemonicWordBankCell(word = it, showCompact = showCompact) {
        onClick(it)
      }
    }
  }
}

@Composable
private fun MnemonicWordBankCell(
  word: MnemonicWordBankCellUiState,
  showCompact: Boolean,
  onClick: () -> Unit
) {

  val textStyle =
    if (showCompact) UniswapTheme.typography.bodySmall else UniswapTheme.typography.bodyLarge
  val verticalPadding =
    if (showCompact) UniswapTheme.spacing.spacing4 else UniswapTheme.spacing.spacing8
  val horizontalPadding =
    if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12

  Box(
    modifier = Modifier
      .clip(UniswapTheme.shapes.xlarge)
      .background(UniswapTheme.colors.surface2)
      .clickable { onClick() }
      .padding(vertical = verticalPadding)
      .padding(horizontal = horizontalPadding),
  ) {
    Text(
      text = word.text,
      style = textStyle,
      color = UniswapTheme.colors.neutral1.copy(if (word.used) 0.6f else 1f),
    )
  }
}

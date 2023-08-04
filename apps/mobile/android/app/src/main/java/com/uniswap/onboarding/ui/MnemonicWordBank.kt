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
  onClick: (word: MnemonicWordBankCellUiState) -> Unit
) {
  FlowRow(
    modifier = Modifier
      .fillMaxWidth()
      .wrapContentHeight(),
    mainAxisSpacing = UniswapTheme.spacing.spacing12,
    crossAxisSpacing = UniswapTheme.spacing.spacing12,
    mainAxisAlignment = MainAxisAlignment.Center,
  ) {
    words.forEach {
      MnemonicWordBankCell(word = it) {
        onClick(it)
      }
    }
  }
}

@Composable
private fun MnemonicWordBankCell(word: MnemonicWordBankCellUiState, onClick: () -> Unit) {
  val textColor = if (word.used) {
    MaterialTheme.colors.onSurface.copy(alpha = 0.6f)
  } else {
    MaterialTheme.colors.onSurface
  }
  Box(
    modifier = Modifier
      .clip(UniswapTheme.shapes.xlarge)
      .background(cellBackgroundColor())
      .clickable { onClick() }
      .padding(vertical = UniswapTheme.spacing.spacing8)
      .padding(horizontal = UniswapTheme.spacing.spacing12),
  ) {
    Text(text = word.text, color = textColor)
  }
}

@Composable
private fun cellBackgroundColor(): Color =
  if (isSystemInDarkTheme()) {
    UniswapColors.Gray900
  } else {
    UniswapColors.Gray100
  }

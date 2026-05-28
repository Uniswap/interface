package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.dp
import com.google.accompanist.flowlayout.FlowRow
import com.google.accompanist.flowlayout.MainAxisAlignment
import com.uniswap.onboarding.backup.ui.model.MnemonicWordBankCellUiState
import com.uniswap.theme.UniswapTheme

/**
 * Used to render a set of clickable mnemonic words
 */
@Composable
fun MnemonicWordBank(
  words: List<MnemonicWordBankCellUiState>,
  shouldShowSmallText: Boolean = false,
  onClick: (word: MnemonicWordBankCellUiState) -> Unit
) {
  FlowRow(
    modifier = Modifier
      .fillMaxWidth()
      .wrapContentHeight(),
    mainAxisSpacing = if (shouldShowSmallText) UniswapTheme.spacing.spacing4 else UniswapTheme.spacing.spacing8,
    crossAxisSpacing = if (shouldShowSmallText) UniswapTheme.spacing.spacing4 else UniswapTheme.spacing.spacing8,
    mainAxisAlignment = MainAxisAlignment.Center,
  ) {
    words.forEach {
      MnemonicWordBankCell(word = it, shouldShowSmallText = shouldShowSmallText) {
        onClick(it)
      }
    }
  }
}

@Composable
private fun MnemonicWordBankCell(
  word: MnemonicWordBankCellUiState,
  shouldShowSmallText: Boolean,
  onClick: () -> Unit
) {
  val textStyle =
    if (shouldShowSmallText) UniswapTheme.typography.body3 else UniswapTheme.typography.body2
  val verticalPadding =
    if (shouldShowSmallText) UniswapTheme.spacing.spacing8 else 10.dp
  val horizontalPadding =
    if (shouldShowSmallText) 10.dp else UniswapTheme.spacing.spacing12

  Box(
    modifier = Modifier
      .shadow(
        10.dp,
        spotColor = UniswapTheme.colors.black.copy(alpha = 0.04f),
        shape = UniswapTheme.shapes.xlarge
      )
  ) {
    Box(modifier = Modifier
      .clip(shape = UniswapTheme.shapes.xlarge)
      .then(Modifier.border(1.dp, UniswapTheme.colors.surface3, UniswapTheme.shapes.xlarge))
      .clickable { onClick() }
      .background(color = UniswapTheme.colors.surface1)
      .padding(vertical = verticalPadding, horizontal = horizontalPadding)) {
      Text(
        text = word.text,
        style = textStyle,
        color = UniswapTheme.colors.neutral1.copy(if (word.used) 0.5f else 1f),
      )
    }
  }
}

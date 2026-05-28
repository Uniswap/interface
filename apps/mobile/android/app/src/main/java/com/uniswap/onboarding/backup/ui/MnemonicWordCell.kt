package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.width
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.uniswap.onboarding.backup.ui.model.MnemonicInputStatus
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a single word as part of an overall seed phrase
 */
@Composable
fun MnemonicWordCell(
  word: MnemonicWordUiState,
  shouldShowSmallText: Boolean = false,
) {
  val textStyle =
    if (shouldShowSmallText) UniswapTheme.typography.body3 else UniswapTheme.typography.body2

  val textColor = when (word.status) {
    MnemonicInputStatus.NO_INPUT -> UniswapTheme.colors.neutral3
    MnemonicInputStatus.CORRECT_INPUT -> UniswapTheme.colors.neutral1
    MnemonicInputStatus.WRONG_INPUT -> UniswapTheme.colors.statusCritical
  }

  Row {
    Text(
      text = "${word.num}",
      color = UniswapTheme.colors.neutral2,
      modifier = Modifier.defaultMinSize(minWidth = if (shouldShowSmallText) 14.dp else 16.dp),
      style = textStyle,
    )
    Spacer(modifier = Modifier.width(UniswapTheme.spacing.spacing16))
    Text(
      modifier = Modifier.weight(1f),
      text = word.text,
      style = textStyle,
      color = textColor
    )
  }
}

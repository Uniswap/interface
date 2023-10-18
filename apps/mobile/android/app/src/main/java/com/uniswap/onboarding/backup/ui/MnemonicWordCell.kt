package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.uniswap.onboarding.backup.ui.model.MnemonicWordUiState
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a single word as part of an overall seed phrase
 */
@Composable
fun MnemonicWordCell(
  modifier: Modifier = Modifier,
  word: MnemonicWordUiState,
  showCompact: Boolean = false,
  onClick: (() -> Unit)? = null,
) {
  val textStyle =
    if (showCompact) UniswapTheme.typography.body2 else UniswapTheme.typography.body1

  val shape = UniswapTheme.shapes.large
  var rowModifier = modifier
    .clip(shape)
    .shadow(1.dp, shape)
    .background(UniswapTheme.colors.surface2)

  if (word.hasError) {
    rowModifier = rowModifier.border(1.dp, UniswapTheme.colors.statusCritical, shape)
  } else if (word.focused) {
    rowModifier = rowModifier.border(1.dp, UniswapTheme.colors.accent1, shape)
  }
  onClick?.let {
    rowModifier = rowModifier.clickable { it() }
  }

  Row(
    modifier = rowModifier
      .padding(horizontal = if (showCompact) UniswapTheme.spacing.spacing12 else UniswapTheme.spacing.spacing16)
      .padding(vertical = if (showCompact) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing12)
  ) {
    Text(
      text = "${word.num}",
      color = UniswapTheme.colors.neutral3,
      modifier = Modifier
        .defaultMinSize(minWidth = 24.dp)
        .align(Alignment.CenterVertically),
      textAlign = TextAlign.Center,
      style = textStyle,
    )
    Spacer(modifier = Modifier.width(UniswapTheme.spacing.spacing12))
    Text(modifier = Modifier.weight(1f), text = word.text, style = textStyle)
  }
}

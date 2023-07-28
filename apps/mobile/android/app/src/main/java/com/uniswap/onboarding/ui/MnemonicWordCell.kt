package com.uniswap.onboarding.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.uniswap.theme.UniswapColors
import com.uniswap.theme.UniswapTheme

/**
 * Component used to display a single word as part of an overall seed phrase
 */
@Composable
fun MnemonicWordCell(
  modifier: Modifier = Modifier,
  index: Int,
  word: String?,
  onClick: () -> Unit = {},
) {
  val shape = UniswapTheme.shapes.large
  Row(
    modifier = modifier
      .shadow(1.dp, shape)
      .clip(shape)
      .background(cellBackgroundColor())
      .clickable { onClick() }
      .padding(horizontal = UniswapTheme.spacing.spacing16)
      .padding(vertical = UniswapTheme.spacing.spacing12)
  ) {
    Text(
      text = "$index",
      color = indexTextColor(),
      modifier = Modifier
        .defaultMinSize(minWidth = 24.dp)
        .align(Alignment.CenterVertically),
      textAlign = TextAlign.Center,
    )
    Spacer(modifier = Modifier.width(UniswapTheme.spacing.spacing12))
    Text(modifier = Modifier.weight(1f), text = word ?: "")
  }
}

@Composable
private fun cellBackgroundColor(): Color =
  if (isSystemInDarkTheme()) { // TODO gary verify if this reflects ThemeModule overrides
    UniswapColors.Gray900
  } else {
    UniswapColors.Gray100
  }

@Composable
private fun indexTextColor(): Color =
  if (isSystemInDarkTheme()) { // TODO gary verify if this reflects ThemeModule overrides
    UniswapColors.Gray350
  } else {
    UniswapColors.Gray250
  }

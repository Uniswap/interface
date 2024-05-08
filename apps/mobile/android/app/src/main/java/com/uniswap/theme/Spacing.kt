package com.uniswap.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Immutable
data class CustomSpacing(
  val spacing1: Dp = 1.dp,
  val spacing2: Dp = 2.dp,
  val spacing4: Dp = 4.dp,
  val spacing8: Dp = 8.dp,
  val spacing12: Dp = 12.dp,
  val spacing16: Dp = 16.dp,
  val spacing24: Dp = 24.dp,
  val spacing28: Dp = 28.dp,
  val spacing32: Dp = 32.dp,
  val spacing36: Dp = 36.dp,
  val spacing48: Dp = 48.dp,
  val spacing60: Dp = 60.dp,
)

val LocalCustomSpacing = staticCompositionLocalOf {
  CustomSpacing()
}

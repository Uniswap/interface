package com.uniswap.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ProvideTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

@Composable
fun UniswapTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit
) {
  val customSpacing = CustomSpacing()
  val customTypography = CustomTypography()
  val customShapes = CustomShapes()

  CompositionLocalProvider(
    LocalCustomSpacing provides customSpacing,
    LocalCustomTypography provides customTypography,
    LocalCustomShapes provides customShapes,
  ) {
    ProvideTextStyle(value = customTypography.bodyLarge) {
      MaterialTheme(
        colors = if (darkTheme) DarkColors else LightColors,
        content = content
      )
    }
  }
}

object UniswapTheme {
  val spacing: CustomSpacing
    @Composable
    get() = LocalCustomSpacing.current

  val typography: CustomTypography
    @Composable
    get() = LocalCustomTypography.current

  val shapes: CustomShapes
    @Composable
    get() = LocalCustomShapes.current
}

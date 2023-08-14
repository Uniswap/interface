package com.uniswap.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material.MaterialTheme
import androidx.compose.material.ProvideTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember

@Composable
fun UniswapTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit
) {
  val customSpacing = CustomSpacing()
  val customTypography = CustomTypography()
  val customShapes = CustomShapes()
  val extendedColors = remember {
    if (darkTheme) darkExtendedColors else lightExtendedColors
  }

  CompositionLocalProvider(
    LocalCustomSpacing provides customSpacing,
    LocalCustomTypography provides customTypography,
    LocalCustomShapes provides customShapes,
    LocalExtendedColors provides extendedColors,
  ) {
    MaterialTheme( // TODO gary MOB-1011 move everything from MaterialTheme to UniswapTheme
      colors = if (darkTheme) DarkColors else LightColors
    ) {
      ProvideTextStyle(value = customTypography.bodyLarge) {
        content()
      }
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

  val extendedColors: ExtendedColors
    @Composable
    get() = LocalExtendedColors.current
}

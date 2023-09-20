package com.uniswap.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import com.uniswap.R

// TODO gary update for Spore changes
@Immutable
data class CustomTypography(
  val defaultFontFamily: FontFamily = FontFamily(
    Font(R.font.basel_book),
    Font(R.font.basel_medium, FontWeight.Medium),
    Font(R.font.basel_semibold, FontWeight.SemiBold),
    Font(R.font.basel_bold, FontWeight.Bold),
  ),
  val defaultLetterSpacing: TextUnit = 0.sp,
  val headlineLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 52.sp,
    lineHeight = 60.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val headlineMedium: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 36.sp,
    lineHeight = 44.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val headlineSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 24.sp,
    lineHeight = 32.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val subheadLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 18.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val subheadSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 16.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val bodyLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 18.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val bodySmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 16.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val bodyMicro: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 16.sp,
    fontWeight = FontWeight.Normal,
    letterSpacing = defaultLetterSpacing,
  ),
  val buttonLabelLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 20.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium,
    letterSpacing = defaultLetterSpacing,
  ),
  val buttonLabelMedium: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 18.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium,
    letterSpacing = defaultLetterSpacing,
  ),
  val buttonLabelSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 16.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium,
    letterSpacing = defaultLetterSpacing,
  ),
  val buttonLabelMicro: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 12.sp,
    lineHeight = 16.sp,
    fontWeight = FontWeight.Medium,
    letterSpacing = defaultLetterSpacing,
  ),
  val monospace: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 20.sp,
    letterSpacing = defaultLetterSpacing,
  ),
)

val LocalCustomTypography = staticCompositionLocalOf {
  CustomTypography()
}

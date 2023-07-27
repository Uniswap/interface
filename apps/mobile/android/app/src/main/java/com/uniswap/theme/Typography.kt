package com.uniswap.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.uniswap.R

// TODO gary update for Spore changes
@Immutable
data class CustomTypography(
  val defaultFontFamily: FontFamily = FontFamily(
    Font(R.font.inter_regular),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_bold, FontWeight.Bold),
  ),
  val headlineLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 40.sp,
    lineHeight = 48.sp,
    fontWeight = FontWeight.SemiBold
  ),
  val headlineMedium: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 32.sp,
    lineHeight = 38.sp,
    fontWeight = FontWeight.Medium
  ),
  val headlineSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 24.sp,
    lineHeight = 28.sp,
    fontWeight = FontWeight.Medium
  ),
  val subheadLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 20.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium
  ),
  val subheadSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 20.sp,
    fontWeight = FontWeight.Medium
  ),
  val bodyLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 16.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.Medium
  ),
  val bodySmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 20.sp
  ),
  val bodyMicro: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 12.sp,
    lineHeight = 16.sp
  ),
  val buttonLabelLarge: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 20.sp,
    lineHeight = 24.sp,
    fontWeight = FontWeight.SemiBold
  ),
  val buttonLabelMedium: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 16.sp,
    lineHeight = 20.sp,
    fontWeight = FontWeight.SemiBold
  ),
  val buttonLabelSmall: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 20.sp,
    fontWeight = FontWeight.SemiBold
  ),
  val buttonLabelMicro: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 12.sp,
    lineHeight = 16.sp,
    fontWeight = FontWeight.SemiBold
  ),
  val monospace: TextStyle = TextStyle(
    fontFamily = defaultFontFamily,
    fontSize = 14.sp,
    lineHeight = 20.sp,
    fontWeight = FontWeight.Bold
  ),
)

val LocalCustomTypography = staticCompositionLocalOf {
  CustomTypography()
}

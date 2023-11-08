package com.uniswap.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.dp

data class CustomShapes(
  val medium: RoundedCornerShape = RoundedCornerShape(20.dp),
  val large: RoundedCornerShape = RoundedCornerShape(24.dp),
  val xlarge: RoundedCornerShape = RoundedCornerShape(100.dp),
  val buttonSmall: RoundedCornerShape = RoundedCornerShape(12.dp),
  val buttonMedium: RoundedCornerShape = RoundedCornerShape(16.dp),
)

val LocalCustomShapes = staticCompositionLocalOf {
  CustomShapes()
}

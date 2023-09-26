package com.uniswap.extensions

import android.annotation.SuppressLint
import android.os.Build
import androidx.compose.foundation.ScrollState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.uniswap.theme.UniswapTheme
import java.lang.Float.min

@SuppressLint("ComposableModifierFactory")
@Composable
fun Modifier.fadingEdges(
  scrollState: ScrollState,
  topEdgeHeight: Dp = 0.dp,
  bottomEdgeHeight: Dp = UniswapTheme.spacing.spacing48,
): Modifier = this.then(Modifier
  // adding layer fixes issue with blending gradient and content
  .graphicsLayer { alpha = 0.99F }
  .drawWithContent {
    drawContent()

    val topColors = listOf(Color.Transparent, Color.Black)
    val topStartY = scrollState.value.toFloat()
    val topGradientHeight = min(topEdgeHeight.toPx(), topStartY)
    val topGradientBrush = Brush.verticalGradient(
      colors = topColors, startY = topStartY, endY = topStartY + topGradientHeight
    )

    val bottomColors = listOf(Color.Black, Color.Transparent)
    val bottomEndY = size.height - scrollState.maxValue + scrollState.value
    val bottomGradientHeight =
      min(bottomEdgeHeight.toPx(), scrollState.maxValue.toFloat() - scrollState.value)
    val bottomGradientBrush = Brush.verticalGradient(
      colors = bottomColors, startY = bottomEndY - bottomGradientHeight, endY = bottomEndY
    )

    // Render gradient with blend mode on Android Q and above
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      drawRect(
        brush = topGradientBrush, blendMode = BlendMode.DstIn
      )
      if (bottomGradientHeight != 0f) {
        drawRect(
          brush = bottomGradientBrush, blendMode = BlendMode.DstIn
        )
      }
    // Otherwise, render gradient without blend mode if the blend mode is not supported
    } else {
      drawRect(
        brush = topGradientBrush,
      )
      if (bottomGradientHeight != 0f) {
        drawRect(
          brush = bottomGradientBrush
        )
      }
    }
  })

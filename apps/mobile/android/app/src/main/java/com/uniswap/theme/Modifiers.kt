package com.uniswap.theme

import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout

fun Modifier.relativeOffset(
  x: Float = 0f,
  y: Float = 0f,
  onOffsetCalculated: (Int, Int) -> Unit = { _, _ -> }
): Modifier = this.then(
  layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)

    val offsetX = (placeable.width * x).toInt()
    val offsetY = (placeable.height * y).toInt()

    onOffsetCalculated(offsetX, offsetY)

    layout(placeable.width, placeable.height) {
      placeable.place(offsetX, offsetY)
    }
  }
)

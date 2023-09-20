package com.uniswap.theme

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun UniswapComponent(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
  UniswapTheme {
    Surface(modifier = modifier, content = content)
  }
}

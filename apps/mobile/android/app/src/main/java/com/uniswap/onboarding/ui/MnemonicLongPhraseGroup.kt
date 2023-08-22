package com.uniswap.onboarding.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import com.uniswap.theme.UniswapTheme

@Composable
fun MnemonicLongPhraseGroup(mnemonic: String) {
  Column(verticalArrangement = Arrangement.Top) {
    Text(
      modifier = Modifier
        .fillMaxWidth()
        .wrapContentHeight()
        .clip(UniswapTheme.shapes.large)
        .background(UniswapTheme.colors.surface2)
        .padding(UniswapTheme.spacing.spacing24),
      text = mnemonic,
      textAlign = TextAlign.Center,
    )
  }
}

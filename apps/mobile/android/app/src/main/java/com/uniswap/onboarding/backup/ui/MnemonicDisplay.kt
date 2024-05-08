package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.uniswap.extensions.fadingEdges
import com.uniswap.theme.UniswapTheme

@Composable
fun MnemonicDisplay(
  viewModel: MnemonicDisplayViewModel,
  mnemonicId: String,
) {

  val words by viewModel.words.collectAsState()

  LaunchedEffect(mnemonicId) {
    viewModel.setup(mnemonicId)
  }

  BoxWithConstraints {
    val showCompact = maxHeight < SCREEN_HEIGHT_BREAKPOINT.dp
    val scrollState = rememberScrollState()

    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(scrollState)
        .padding(horizontal = UniswapTheme.spacing.spacing16)
        .fadingEdges(scrollState)
    ) {
      Box(
        modifier = Modifier
          .padding(bottom = UniswapTheme.spacing.spacing16)
      ) {
        MnemonicWordsGroup(words = words, showCompact = showCompact)
      }
    }
  }
}

private const val SCREEN_HEIGHT_BREAKPOINT = 347

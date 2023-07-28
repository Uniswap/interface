package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime .setValue
import androidx.compose.ui.Modifier
import com.uniswap.theme.UniswapTheme

/**
 * Renders screen for confirming that a user wrote down their seed phrase
 * by testing they can select it in order
 */
@Composable
fun MnemonicConfirmation(words: List<String>) {
  val shuffledWords = remember { words.shuffled() }
  var inputtedWords by remember {
    mutableStateOf<List<String?>>(words.map { null })
  }

  LaunchedEffect(key1 = inputtedWords) {
    val size = inputtedWords.size
    if (size == words.size) {
      // TODO gary handle done trigger
    }
  }

  Column(modifier = Modifier.fillMaxSize()) {
    MnemonicDisplay(words = inputtedWords) { clickedIndex, clickedWord ->
      // TODO gary handle onclick
    }
    Spacer(modifier = Modifier.height(UniswapTheme.spacing.spacing24))
    MnemonicWordBank(words = shuffledWords) { clickedWord ->
      // TODO gary handle onclick
    }
  }
}



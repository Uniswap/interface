package com.uniswap.onboarding.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.uniswap.theme.UniswapTheme

/**
 * Renders screen for confirming that a user wrote down their seed phrase
 * by testing they can select it in order
 */
@Composable
fun MnemonicConfirmation(
  sourceWords: List<String>,
  viewModel: MnemonicConfirmationViewModel = viewModel()
) {

  val displayedWords by viewModel.displayWords.collectAsState()
  val wordBankList by viewModel.wordBankList.collectAsState()

  LaunchedEffect(sourceWords) {
    viewModel.setup(sourceWords)
  }

  LaunchedEffect(displayedWords) {
    val size = displayedWords.size
    if (size == sourceWords.size) {
      // TODO gary handle done trigger
    }
  }

  Column(modifier = Modifier.fillMaxSize().padding(horizontal = UniswapTheme.spacing.spacing16)) {
    MnemonicDisplay(words = displayedWords) {
      viewModel.handleWordRowClick(it)
    }
    Spacer(modifier = Modifier.height(UniswapTheme.spacing.spacing24))
    MnemonicWordBank(words = wordBankList) {
      viewModel.handleWordBankClick(it)
    }
  }
}



package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.uniswap.theme.UniswapTheme

/**
 * Renders screen for confirming that a user wrote down their seed phrase
 * by testing they can select it in order
 */
@Composable
fun MnemonicConfirmation(
  viewModel: MnemonicConfirmationViewModel,
  mnemonicId: String,
  shouldShowSmallText: Boolean,
  onCompleted: () -> Unit,
) {

  val displayedWords by viewModel.selectedWords.collectAsState()
  val wordBankList by viewModel.wordBankList.collectAsState()
  val completed by viewModel.completed.collectAsState()

  LaunchedEffect(mnemonicId) {
    viewModel.setup(mnemonicId)
  }

  LaunchedEffect(completed) {
    if (completed) {
      onCompleted()
    }
  }

  BoxWithConstraints {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
    ) {
      MnemonicWordsGroup(
        words = displayedWords,
        shouldShowSmallText = shouldShowSmallText,
      )
      Spacer(modifier = Modifier.height(UniswapTheme.spacing.spacing24))
      MnemonicWordBank(words = wordBankList, shouldShowSmallText = shouldShowSmallText) {
        viewModel.handleWordBankClick(it.index)
      }
    }
  }
}

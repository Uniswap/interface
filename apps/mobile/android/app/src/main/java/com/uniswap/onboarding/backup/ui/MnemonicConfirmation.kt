package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
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
  pageStart: Int = 0,
  pageSize: Int = 0,
  currentPage: Int = 0,
  totalPages: Int = 0,
  onCompleted: () -> Unit,
) {

  val displayedWords by viewModel.selectedWords.collectAsState()
  val wordBankList by viewModel.wordBankList.collectAsState()
  val completed by viewModel.completed.collectAsState()

  LaunchedEffect(mnemonicId, pageStart, pageSize) {
    viewModel.setup(mnemonicId, pageStart, pageSize)
  }

  LaunchedEffect(completed) {
    if (completed) {
      onCompleted()
    }
  }

  Column(
    modifier = Modifier
      .fillMaxSize()
  ) {
    Column(
      modifier = Modifier
        .weight(1f, fill = true)
        .verticalScroll(rememberScrollState())
    ) {
      MnemonicWordsGroup(
        words = displayedWords,
        shouldShowSmallText = shouldShowSmallText,
      )

      if (totalPages > 1) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp),
          horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        ) {
          repeat(totalPages) { i ->
            Box(
              modifier = Modifier
                .size(6.dp)
                .background(
                  color = if (i == currentPage) UniswapTheme.colors.neutral1 else UniswapTheme.colors.neutral3,
                  shape = CircleShape,
                )
            )
          }
        }
      }
    }

    MnemonicWordBank(words = wordBankList, shouldShowSmallText = shouldShowSmallText) {
      viewModel.handleWordBankClick(it.index)
    }
  }
}

package com.uniswap.onboarding.backup.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import com.uniswap.onboarding.shared.CopyButton
import com.uniswap.theme.relativeOffset
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.math.abs

@Composable
fun MnemonicDisplay(
  viewModel: MnemonicDisplayViewModel,
  mnemonicId: String,
  copyText: String,
  copiedText: String,
  onHeightMeasured: (height: Float) -> Unit,
  onEmptyMnemonic: (mnemonicId: String) -> Unit
) {
  val words by viewModel.words.collectAsState()
  val textToCopy = AnnotatedString(words.joinToString(" ") { it.text })
  val density = LocalDensity.current.density
  var buttonOffset by remember { mutableStateOf(20.dp) }

  LaunchedEffect(mnemonicId) {
    viewModel.setup(mnemonicId)

    // Check and log if the mnemonic is empty after 1 second to avoid calling onEmptyMnemonic too early
    withTimeoutOrNull<Unit>(1000L) {
      viewModel.words.collect { currentWords ->
        if (currentWords.isEmpty() || currentWords.any { it.text.isBlank() }) {
          onEmptyMnemonic(mnemonicId)
          return@collect
        }
      }
    }
  }

  BoxWithConstraints {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .wrapContentHeight()
        .verticalScroll(rememberScrollState())
        .onSizeChanged { size ->
          onHeightMeasured(size.height / density)
        }
    ) {
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .wrapContentHeight()
          .padding(top = buttonOffset)
          .wrapContentSize(Alignment.Center)
      ) {
        MnemonicWordsGroup(words = words)

        Box(
          modifier = Modifier
            .align(Alignment.TopCenter)
            .relativeOffset(y = -0.5f) { _, offsetY ->
              buttonOffset = (abs(offsetY) / density).dp
            }
        ) {
          CopyButton(
            copyButtonText = copyText,
            copiedButtonText = copiedText,
            textToCopy = textToCopy,
            isSensitive = true
          )
        }
      }
    }
  }
}

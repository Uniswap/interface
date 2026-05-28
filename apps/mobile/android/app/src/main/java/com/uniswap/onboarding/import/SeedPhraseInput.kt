package com.uniswap.onboarding.import

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.ContentAlpha
import androidx.compose.material.Icon
import androidx.compose.material.LocalContentColor
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.focus.focusRequester
import com.uniswap.R
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.InvalidPhrase
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.InvalidWord
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.NotEnoughWords
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.TooManyWords
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.WrongRecoveryPhrase
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.WordIsAddress
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.Status.Error
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.Status.Valid
import com.uniswap.onboarding.shared.PasteButton
import com.uniswap.theme.UniswapTheme
import com.uniswap.theme.relativeOffset
import kotlin.math.abs

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun SeedPhraseInput(
  viewModel: SeedPhraseInputViewModel
) {
  val focusRequester = remember { FocusRequester() }
  val density = LocalDensity.current.density
  var buttonOffset by remember { mutableStateOf(20.dp) }
  val keyboardController = LocalSoftwareKeyboardController.current

  LaunchedEffect(viewModel.isFocused) {
    if (viewModel.isFocused) {
      focusRequester.requestFocus()
    } else {
      focusRequester.freeFocus()
      keyboardController?.hide()
    }
  }

  Column(
    modifier = Modifier.wrapContentHeight(),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .wrapContentHeight()
        .padding(bottom = buttonOffset)
    ) {
      BasicTextField(
        modifier = Modifier
          .fillMaxWidth()
          .clip(UniswapTheme.shapes.small)
          .background(UniswapTheme.colors.surface1)
          .border(
            width = 1.dp,
            shape = UniswapTheme.shapes.small,
            color = mapStatusToBorderColor(viewModel.status),
          )
          .focusRequester(focusRequester),
        value = viewModel.input,
        onValueChange = { viewModel.handleInputChange(it) },
        cursorBrush = SolidColor(LocalContentColor.current.copy(ContentAlpha.high)),
        textStyle = UniswapTheme.typography.subheading2.copy(
          textAlign = TextAlign.Start,
          color = UniswapTheme.colors.neutral1
        ),
        keyboardOptions = KeyboardOptions(
          keyboardType = KeyboardType.Password,
          capitalization = KeyboardCapitalization.None
        ),
        decorationBox = { innerTextField ->
          Box(
            modifier = Modifier
              .wrapContentHeight()
              .heightIn(min = 120.dp)
              .padding(20.dp),
          ) {
            if (viewModel.input.text.isEmpty()) {
              Text(
                text = viewModel.rnStrings.inputPlaceholder,
                style = UniswapTheme.typography.subheading2.copy(
                  color = UniswapTheme.colors.neutral3
                )
              )
            }
            innerTextField()
          }
        }
      )

      if (viewModel.input.text.isEmpty()) {
        PasteButton(
          modifier = Modifier
            .align(Alignment.BottomCenter)
            .relativeOffset(y = .5f) { _, offsetY ->
              buttonOffset = (abs(offsetY) / density).dp
            },
          pasteButtonText = viewModel.rnStrings.pasteButton,
          onPaste = {
            viewModel.handleInputChange(
              TextFieldValue(it, selection = TextRange(it.length))
            )
            focusRequester.requestFocus()
          }
        )
      }
    }

    SeedPhraseError(viewModel)
  }
}

@Composable
private fun SeedPhraseError(viewModel: SeedPhraseInputViewModel) {
  val status = viewModel.status
  val rnStrings = viewModel.rnStrings
  var text = ""

  if (status is Error) {
    text = when (val error = status.error) {
      is InvalidWord -> "${rnStrings.errorInvalidWord} ${error.word}"
      is NotEnoughWords, TooManyWords -> rnStrings.errorPhraseLength
      is WrongRecoveryPhrase -> rnStrings.errorWrongPhrase
      is InvalidPhrase -> rnStrings.errorInvalidPhrase
      is WordIsAddress -> rnStrings.errorWordIsAddress
    }
  }

  Row(
    horizontalArrangement = Arrangement.spacedBy(UniswapTheme.spacing.spacing4),
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier.alpha(if (text.isEmpty()) 0f else 1f)
  ) {
    Icon(
      painter = painterResource(id = R.drawable.uniswap_icon_alert_triangle),
      tint = UniswapTheme.colors.statusCritical,
      contentDescription = null,
      modifier = Modifier.size(16.dp)
    )
    Text(text, style = UniswapTheme.typography.body3, color = UniswapTheme.colors.statusCritical)
  }
}

@Composable
private fun mapStatusToBorderColor(status: SeedPhraseInputViewModel.Status): Color =
  when (status) {
    Valid -> UniswapTheme.colors.statusSuccess
    is Error -> UniswapTheme.colors.statusCritical
    else -> UniswapTheme.colors.surface3
  }

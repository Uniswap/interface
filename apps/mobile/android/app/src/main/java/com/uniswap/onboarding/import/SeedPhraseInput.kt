package com.uniswap.onboarding.import

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.Colors
import androidx.compose.material.Icon
import androidx.compose.material.OutlinedButton
import androidx.compose.material.Text
import androidx.compose.material.TextFieldDefaults
import androidx.compose.material.LocalContentColor
import androidx.compose.material.ContentAlpha
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.uniswap.R
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.InvalidPhrase
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.InvalidWord
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.NotEnoughWords
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.TooManyWords
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.MnemonicError.WrongRecoveryPhrase
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.Status.Error
import com.uniswap.onboarding.import.SeedPhraseInputViewModel.Status.Valid
import com.uniswap.theme.UniswapTheme

@Composable
fun SeedPhraseInput(viewModel: SeedPhraseInputViewModel, onHelpTextPress: () -> Unit) {
  val focusRequester = remember { FocusRequester() }

  LaunchedEffect(Unit) {
    focusRequester.requestFocus()
  }

  Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.spacedBy(UniswapTheme.spacing.spacing12, Alignment.Top),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    BasicTextField(
      modifier = Modifier
        .fillMaxWidth()
        .clip(UniswapTheme.shapes.medium)
        .background(UniswapTheme.colors.surface2)
        .border(
          width = 1.dp,
          shape = UniswapTheme.shapes.medium,
          color = mapStatusToBorderColor(viewModel.status),
        )
        .focusRequester(focusRequester),
      value = viewModel.input,
      onValueChange = { viewModel.handleInputChange(it) },
      cursorBrush = SolidColor(LocalContentColor.current.copy(ContentAlpha.high)),
      textStyle = UniswapTheme.typography.body1.copy(
        textAlign = TextAlign.Start,
        color = UniswapTheme.colors.neutral1
      ),
      keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Password,
        capitalization = KeyboardCapitalization.None
      )
    ) { innerTextField ->
      Box(
        modifier = Modifier
          .wrapContentHeight()
          .heightIn(min = 120.dp)
          .padding(UniswapTheme.spacing.spacing16),
        contentAlignment = Alignment.Center,
      ) {
        val isEmpty = viewModel.input.text.isEmpty()

        Box(
          contentAlignment = Alignment.CenterStart,
          modifier = if (isEmpty) Modifier else Modifier.fillMaxWidth()
        ) {
          if (isEmpty) {
            SeedPhrasePlaceholder(viewModel, focusRequester)
          }
          innerTextField()
        }
      }
    }

    Spacer(modifier = Modifier.height(UniswapTheme.spacing.spacing4))
    SeedPhraseError(viewModel)
    SeedPhraseRecovery(viewModel, onHelpTextPress)
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeedPhrasePlaceholder(
  viewModel: SeedPhraseInputViewModel,
  focusRequester: FocusRequester
) {

  FlowRow(
    modifier = Modifier.height(IntrinsicSize.Max),
    horizontalArrangement = Arrangement.Center,
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Text(
      viewModel.rnStrings.inputPlaceholder,
      color = UniswapTheme.colors.neutral2,
    )
    Spacer(modifier = Modifier.width(UniswapTheme.spacing.spacing8))
    SeedPhrasePasteButton(viewModel, focusRequester)
  }
}

@Composable
private fun SeedPhrasePasteButton(
  viewModel: SeedPhraseInputViewModel,
  focusRequester: FocusRequester
) {

  val clipboardManager = LocalClipboardManager.current

  Button(
    onClick = {
      clipboardManager.getText()?.toString()?.let {
        viewModel.handleInputChange(
          TextFieldValue(it, selection = TextRange(it.length))
        )
        focusRequester.requestFocus()
      }
    },
    colors = ButtonDefaults.buttonColors(
      contentColor = UniswapTheme.colors.neutral2,
      backgroundColor = UniswapTheme.colors.surface3.compositeOver(UniswapTheme.colors.surface2),
    ),
    shape = UniswapTheme.shapes.buttonMedium,
    contentPadding = PaddingValues(
      top = UniswapTheme.spacing.spacing8,
      bottom = UniswapTheme.spacing.spacing8,
      start = UniswapTheme.spacing.spacing4,
      end = UniswapTheme.spacing.spacing8
    ),
  ) {
    Icon(
      painterResource(id = R.drawable.uniswap_icon_paste),
      contentDescription = null,
    )
    Spacer(modifier = Modifier.width(UniswapTheme.spacing.spacing4))
    Text(viewModel.rnStrings.pasteButton, style = UniswapTheme.typography.buttonLabel4)
  }
}

@Composable
private fun SeedPhraseError(viewModel: SeedPhraseInputViewModel) {
  val status = viewModel.status
  val rnStrings = viewModel.rnStrings

  if (status is Error) {
    val text = when (val error = status.error) {
      is InvalidWord -> "${rnStrings.errorInvalidWord} ${error.word}"
      is NotEnoughWords, TooManyWords -> rnStrings.errorPhraseLength
      is WrongRecoveryPhrase -> rnStrings.errorWrongPhrase
      is InvalidPhrase -> rnStrings.errorInvalidPhrase
    }
    Row(horizontalArrangement = Arrangement.spacedBy(UniswapTheme.spacing.spacing4)) {
      Icon(
        painter = painterResource(id = R.drawable.uniswap_icon_alert_triangle),
        tint = UniswapTheme.colors.statusCritical,
        contentDescription = null,
      )
      Text(text, color = UniswapTheme.colors.statusCritical)
    }
  }
}

@Composable
private fun SeedPhraseRecovery(viewModel: SeedPhraseInputViewModel, onHelpTextPress: () -> Unit) {
  val interactionSource = remember { MutableInteractionSource() }
  Text(
    viewModel.rnStrings.helpText,
    color = UniswapTheme.colors.accent1,
    modifier = Modifier.clickable(
      interactionSource = interactionSource,
      indication = null,
    ) {
      onHelpTextPress()
    }
  )
}

@Composable
private fun mapStatusToBorderColor(status: SeedPhraseInputViewModel.Status): Color =
  when (status) {
    Valid -> UniswapTheme.colors.statusSuccess
    is Error -> UniswapTheme.colors.statusCritical
    else -> Color.Transparent
  }

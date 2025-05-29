package com.uniswap.onboarding.shared

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.uniswap.R
import com.uniswap.theme.UniswapTheme

enum class ActionButtonStatus {
  SUCCESS, NEUTRAL
}

/**
 * Button that calls the action when clicked
 */
@Composable
fun ActionButton(
  modifier: Modifier = Modifier,
  action: () -> Unit,
  text: String,
  status: ActionButtonStatus = ActionButtonStatus.NEUTRAL,
  @DrawableRes iconDrawable: Int? = null,
) {
  val iconColor = when (status) {
    ActionButtonStatus.SUCCESS -> UniswapTheme.colors.statusSuccess
    ActionButtonStatus.NEUTRAL -> UniswapTheme.colors.neutral2
  }
  val textColor = when (status) {
    ActionButtonStatus.SUCCESS -> UniswapTheme.colors.statusSuccess
    ActionButtonStatus.NEUTRAL -> UniswapTheme.colors.neutral1
  }

  Box(
    modifier = modifier.shadow(
      10.dp,
      spotColor = UniswapTheme.colors.black.copy(alpha = 0.04f),
      shape = UniswapTheme.shapes.small
    )
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(UniswapTheme.spacing.spacing4),
      modifier = Modifier
        .clip(shape = UniswapTheme.shapes.small)
        .border(1.dp, UniswapTheme.colors.surface3, UniswapTheme.shapes.small)
        .clickable { action() }
        .background(color = UniswapTheme.colors.surface1)
        .padding(
          top = UniswapTheme.spacing.spacing8,
          end = UniswapTheme.spacing.spacing16,
          bottom = UniswapTheme.spacing.spacing8,
          start = if (iconDrawable != null) UniswapTheme.spacing.spacing8 else UniswapTheme.spacing.spacing16
        )) {
      iconDrawable?.let {
        Icon(
          painter = painterResource(id = it),
          contentDescription = null,
          tint = iconColor,
          modifier = Modifier.size(20.dp)
        )
      }
      Text(
        text = text, color = textColor, style = UniswapTheme.typography.buttonLabel4
      )
    }
  }
}

@Composable
fun PasteButton(
  modifier: Modifier = Modifier,
  pasteButtonText: String,
  onPaste: (text: String) -> Unit
) {
  val clipboardManager = LocalClipboardManager.current

  fun onClick() {
    clipboardManager.getText()?.toString()?.let {
      onPaste(it)
    }
  }

  ActionButton(
    action = { onClick() },
    text = pasteButtonText,
    iconDrawable = R.drawable.uniswap_icon_paste,
    modifier = modifier
  )
}

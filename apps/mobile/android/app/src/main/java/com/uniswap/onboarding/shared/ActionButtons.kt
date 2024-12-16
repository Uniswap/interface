package com.uniswap.onboarding.shared

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import com.uniswap.R
import com.uniswap.theme.UniswapTheme
import kotlinx.coroutines.delay
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

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
    Row(verticalAlignment = Alignment.CenterVertically,
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

/**
 * A composable function that displays a button for copying text to the clipboard. On click
 * it shows that the text has been copied and will allow copying again after a delay. Optionally
 * if the text is sensitive, it will be marked as sensitive and cleared from the clipboard after
 * a delay.
 *
 * @param copyButtonText The text to display on the button when the text has not been copied yet.
 * @param copiedButtonText The text to display on the button after the text has been copied.
 * @param textToCopy The [AnnotatedString] that will be copied to the clipboard when the button is clicked.
 * @param isSensitive An optional parameter specifying that the text being copied is sensitive and should
 * be marked as so. Additionally it will be cleared after time.
 */
@Composable
fun CopyButton(
  modifier: Modifier = Modifier,
  copyButtonText: String,
  copiedButtonText: String,
  textToCopy: AnnotatedString,
  isSensitive: Boolean = false,
) {
  val context = LocalContext.current
  val backgroundExecutor = remember {
    Executors.newSingleThreadScheduledExecutor()
  }
  DisposableEffect(Unit) {
    onDispose {
      backgroundExecutor.shutdown()
    }
  }

  val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

  // Time after which the button reverts to the copy state
  val copyTimeout: Long = 2000
  var isCopied by remember { mutableStateOf(false) }
  var copyTimeoutId by remember { mutableStateOf(0) }

  fun onClick() {
    val label = if (isSensitive) "sensitive data" else "copied text"
    val clipData = ClipData.newPlainText(label, textToCopy)
    if (isSensitive) {
      clipData.description.extras = PersistableBundle().apply {
        val extraKey = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          ClipDescription.EXTRA_IS_SENSITIVE
        } else {
          "android.content.extra.IS_SENSITIVE"
        }
        putBoolean(extraKey, true)
      }
      backgroundExecutor.schedule({
        clipboard.clearPrimaryClip()
      }, 2, TimeUnit.MINUTES)
    }

    clipboard.setPrimaryClip(clipData)
    copyTimeoutId++
    isCopied = true
  }


  LaunchedEffect(copyTimeoutId) {
    delay(copyTimeout)
    isCopied = false
  }

  ActionButton(
    action = { onClick() },
    text = if (isCopied) copiedButtonText else copyButtonText,
    iconDrawable = R.drawable.uniswap_icon_copy,
    status = if (isCopied) ActionButtonStatus.SUCCESS else ActionButtonStatus.NEUTRAL,
    modifier = modifier
  )
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

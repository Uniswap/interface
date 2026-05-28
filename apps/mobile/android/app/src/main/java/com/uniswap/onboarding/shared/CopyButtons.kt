package com.uniswap.onboarding.shared

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.PersistableBundle
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.uniswap.R
import com.uniswap.theme.UniswapTheme
import kotlinx.coroutines.delay
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit


/**
 * A composable that displays a copy icon button.
 * The icon changes to success color when content is copied to the clipboard.
 *
 * @param modifier The modifier to be applied to the component
 * @param textToCopy The text to be copied to clipboard as an AnnotatedString
 * @param isSensitive Whether the text contains sensitive information that should be cleared from clipboard after a delay
 */
@Composable
fun CopyButtonIcon(
  modifier: Modifier = Modifier,
  textToCopy: AnnotatedString,
  isSensitive: Boolean = false,
) {
  val (isCopied, onClick) = rememberCopyState(textToCopy, isSensitive)

  Box(
    modifier = modifier
      .clickable(
        interactionSource = remember { MutableInteractionSource() },
        indication = null
      ) { onClick() }
  ) {
    Icon(
      painter = painterResource(id = R.drawable.uniswap_icon_copy_outline),
      contentDescription = null,
      tint = if (isCopied) UniswapTheme.colors.statusSuccess else UniswapTheme.colors.neutral1,
      modifier = Modifier.size(20.dp)
    )
  }
}

/**
 * A composable that displays a copy button with text.
 * The button text changes when content is copied to the clipboard to provide visual feedback.
 *
 * @param modifier The modifier to be applied to the component
 * @param copyButtonText The text to display on the button before copying
 * @param copiedButtonText The text to display on the button after copying
 * @param textToCopy The text to be copied to clipboard as an AnnotatedString
 * @param isSensitive Whether the text contains sensitive information that should be cleared from clipboard after a delay
 */
@Composable
fun CopyButton(
  modifier: Modifier = Modifier,
  copyButtonText: String,
  copiedButtonText: String,
  textToCopy: AnnotatedString,
  isSensitive: Boolean = false,
) {
  val (isCopied, onClick) = rememberCopyState(textToCopy, isSensitive)

  ActionButton(
    action = { onClick() },
    text = if (isCopied) copiedButtonText else copyButtonText,
    iconDrawable = R.drawable.uniswap_icon_copy,
    status = if (isCopied) ActionButtonStatus.SUCCESS else ActionButtonStatus.NEUTRAL,
    modifier = modifier
  )
}

/**
 * A composable state function that manages clipboard operations.
 * Handles copying text to clipboard and maintaining copied state with visual feedback.
 *
 * @param textToCopy The text to be copied to clipboard as an AnnotatedString
 * @param isSensitive Whether the text contains sensitive information that should be handled securely.
 *                    When true, sensitive data will be marked as such and will be cleared from clipboard after 2 minutes.
 * @return A Pair containing:
 *         - Boolean: Whether the text has been copied (true) or not (false)
 *         - Function: Lambda function to trigger the copy operation
 */
@Composable
fun rememberCopyState(
  textToCopy: AnnotatedString,
  isSensitive: Boolean = false
): Pair<Boolean, () -> Unit> {
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

  val onClick = {
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

  return Pair(isCopied, onClick)
}

@Preview(backgroundColor = 0xFFE0E0E0, showBackground = true)
@Composable
fun CopyButtonPreview() {
  UniswapTheme {
    Column {
      CopyButtonIcon(
        textToCopy = AnnotatedString("whatevs"),
        isSensitive = true
      )
      CopyButton(
        copyButtonText = "Copy",
        copiedButtonText = "Copied",
        textToCopy = AnnotatedString("whatevs"),
        isSensitive = true
      )
    }

  }
}

package com.uniswap.notifications

import android.util.Log
import androidx.annotation.Keep
import com.onesignal.notifications.INotification
import com.onesignal.notifications.INotificationReceivedEvent
import com.onesignal.notifications.INotificationServiceExtension
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject

@Keep
class SilentPushNotificationServiceExtension : INotificationServiceExtension {
  override fun onNotificationReceived(event: INotificationReceivedEvent) {
    val notification = event.notification
    val payload = buildPayload(notification)

    val hasContentAvailableFlag = hasContentAvailable(payload)
    val isMissingVisibleContent = notification.isMissingVisibleContent()

    Log.d(
      TAG,
      "Notification received. hasContentAvailable=$hasContentAvailableFlag, " +
        "missingVisibleContent=$isMissingVisibleContent, payload=$payload",
    )

    if (!hasContentAvailableFlag && !isMissingVisibleContent) {
      return
    }

    Log.d(TAG, "Emitting silent push event: $payload")
    val payloadForEmission = try {
      JSONObject(payload.toString())
    } catch (error: JSONException) {
      Log.w(TAG, "Failed to clone payload for emission: ${error.message}")
      payload
    }

    CoroutineScope(Dispatchers.Default).launch {
      withContext(Dispatchers.Main) {
        SilentPushEventEmitterModule.emitEvent(payloadForEmission)
      }
    }

    if (isMissingVisibleContent) {
      event.preventDefault()
    }
  }

  private fun INotification.isMissingVisibleContent(): Boolean {
    val title: String? = this.title
    val body: String? = this.body
    return title.isNullOrBlank() && body.isNullOrBlank()
  }

  private fun buildPayload(notification: INotification): JSONObject {
    val rawPayload = notification.rawPayload
    val payload = try {
      if (rawPayload.isNullOrBlank()) JSONObject() else JSONObject(rawPayload)
    } catch (error: JSONException) {
      Log.w(TAG, "Failed parsing raw payload: ${error.message}")
      JSONObject()
    }

    notification.additionalData?.let { additionalData ->
      try {
        payload.put("additionalData", additionalData)
      } catch (error: JSONException) {
        Log.w(TAG, "Failed to append additional data: ${error.message}")
      }
    }

    return payload
  }

  private fun hasContentAvailable(payload: JSONObject?): Boolean {
    if (payload == null) {
      return false
    }

    if (payload.hasContentAvailableFlag()) {
      return true
    }

    val aps = payload.optJSONObject("aps")
    if (aps != null && aps.hasContentAvailableFlag()) {
      return true
    }

    val additionalData = payload.optJSONObject("additionalData")
    if (additionalData != null && additionalData.hasContentAvailableFlag()) {
      return true
    }

    return false
  }

  private fun JSONObject.hasContentAvailableFlag(): Boolean {
    return opt(CONTENT_AVAILABLE_UNDERSCORE).isTruthy() || opt(CONTENT_AVAILABLE_HYPHEN).isTruthy()
  }

  private fun Any?.isTruthy(): Boolean {
    return when (this) {
      null, JSONObject.NULL -> false
      is Boolean -> this
      is Int -> this == 1
      is Long -> this == 1L
      is Double -> this == 1.0
      is Float -> this == 1f
      is String -> equals("1", ignoreCase = true) || equals("true", ignoreCase = true)
      else -> false
    }
  }

  companion object {
    private const val TAG = "SilentPushExt"
    private const val CONTENT_AVAILABLE_UNDERSCORE = "content_available"
    private const val CONTENT_AVAILABLE_HYPHEN = "content-available"
  }
}

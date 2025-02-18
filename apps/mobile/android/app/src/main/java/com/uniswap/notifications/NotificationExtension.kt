package com.uniswap.notifications

import android.app.Application
import android.content.Context
import android.provider.Settings.Secure
import com.onesignal.OSNotificationReceivedEvent
import com.onesignal.OneSignal.OSRemoteNotificationReceivedHandler
import com.statsig.androidsdk.Statsig
import com.statsig.androidsdk.StatsigOptions
import com.statsig.androidsdk.StatsigUser
import com.uniswap.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * OneSignal extension used to intercept notifications, integrating with Statsig to gate and expose
 * test groups.
 */
class NotificationExtension : OSRemoteNotificationReceivedHandler {

  private val scope = CoroutineScope(Dispatchers.IO)

  override fun remoteNotificationReceived(
    context: Context?,
    notificationReceivedEvent: OSNotificationReceivedEvent
  ) {
    val notification = notificationReceivedEvent.notification
    val additionalData = notification.additionalData
    val notificationType = if (additionalData.has(FIELD_NOTIFICATION_TYPE)) additionalData.getString(FIELD_NOTIFICATION_TYPE) else null
    val isGatedNotification = notificationType == TYPE_UNFUNDED_WALLET_REMINDER ||
      notificationType == TYPE_PRICE_ALERT

    if (isGatedNotification) {
      scope.launch(Dispatchers.IO) {
        if (!Statsig.isInitialized()) {
          val options = StatsigOptions(api = STATSIG_PROXY_URL, eventLoggingAPI = STATSIG_PROXY_URL).apply {
            setEnvironmentParameter(STATSIG_ENVIRONMENT_KEY_TIER, getStatsigTier())
          }
          val deviceId = Secure.getString(context!!.contentResolver, Secure.ANDROID_ID)
          val user = StatsigUser(userID = deviceId)
          user.custom = mapOf("app" to "mobile")

          Statsig.initialize(
            context!!.applicationContext as Application,
            STATSIG_SDK_KEY,
            user,
            options
          )
        }

        val enabled = when(notificationType) {
          TYPE_UNFUNDED_WALLET_REMINDER -> Statsig.checkGate(FEATURE_GATE_UNFUNDED_WALLET)
          TYPE_PRICE_ALERT -> Statsig.checkGate(FEATURE_GATE_PRICE_ALERT)
          else -> true
        }
        // Passing null will skip the notification
        notificationReceivedEvent.complete(if (enabled) notification else null)
      }
    } else {
      notificationReceivedEvent.complete(notification)
    }
  }

  private fun getStatsigTier(): String = when(BuildConfig.FLAVOR) {
    "dev" -> "development"
    "beta" -> "beta"
    "prod" -> "production"
    else -> "production"
  }

  companion object {
    // fake value that gets replaced by the proxy
    private const val STATSIG_SDK_KEY = "client-000000000000000000000000000000000000000000"
    private const val STATSIG_PROXY_URL =
      "https://gating.android.wallet.gateway.uniswap.org/v1/statsig-proxy"
    private const val STATSIG_ENVIRONMENT_KEY_TIER = "tier"

    private const val FEATURE_GATE_UNFUNDED_WALLET = "notification_unfunded_wallet_android"
    private const val FEATURE_GATE_PRICE_ALERT = "notification_price_alerts_android"

    private const val FIELD_NOTIFICATION_TYPE = "notification_type"
    private const val TYPE_UNFUNDED_WALLET_REMINDER = "unfunded_wallet_reminder"
    private const val TYPE_PRICE_ALERT = "price_alert"
  }
}

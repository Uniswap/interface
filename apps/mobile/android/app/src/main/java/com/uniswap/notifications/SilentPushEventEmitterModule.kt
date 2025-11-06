package com.uniswap.notifications

import android.util.Log
import androidx.annotation.Keep
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.uniswap.utils.toWritableMap
import org.json.JSONObject

@Keep
@ReactModule(name = SilentPushEventEmitterModule.MODULE_NAME)
class SilentPushEventEmitterModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = MODULE_NAME

  override fun initialize() {
    super.initialize()
    instance = this
    listenerCount = 0
    Log.d(TAG, "SilentPushEventEmitter initialized")
    flushPendingEvents()
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    if (instance === this) {
      instance = null
    }
    listenerCount = 0
  }

  @ReactMethod
  fun addListener(eventName: String) {
    if (eventName != EVENT_NAME) {
      return
    }
    listenerCount += 1
    flushPendingEvents()
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    if (count <= 0) {
      return
    }
    listenerCount = (listenerCount - count).coerceAtLeast(0)
  }

  private fun flushPendingEvents() {
    if (!hasListeners()) {
      return
    }

    val events = synchronized(pendingPayloads) {
      if (pendingPayloads.isEmpty()) {
        null
      } else {
        val copy = ArrayList(pendingPayloads)
        pendingPayloads.clear()
        copy
      }
    } ?: return

    Log.d(TAG, "Flushing ${events.size} queued silent push events")
    events.forEach { sendEvent(it) }
  }

  private fun sendEvent(payload: JSONObject) {
    if (!reactApplicationContext.hasActiveCatalystInstance()) {
      synchronized(pendingPayloads) {
        Log.d(TAG, "No active Catalyst instance; queueing payload: ${payload.toString()}")
        pendingPayloads.add(JSONObject(payload.toString()))
      }
      return
    }

    val map = payload.toWritableMap()
    reactApplicationContext.runOnUiQueueThread {
      if (!reactApplicationContext.hasActiveCatalystInstance()) {
        synchronized(pendingPayloads) {
          Log.d(TAG, "Catalyst inactive on UI thread; re-queueing payload: ${payload.toString()}")
          pendingPayloads.add(JSONObject(payload.toString()))
        }
        return@runOnUiQueueThread
      }

      Log.d(TAG, "Emitting silent push payload to JS: ${payload.toString()}")
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_NAME, map)
    }
  }

  private fun hasListeners(): Boolean = instance != null && listenerCount > 0

  companion object {
    const val MODULE_NAME = "SilentPushEventEmitter"
    private const val EVENT_NAME = "SilentPushReceived"
    private const val TAG = "SilentPushEmitter"
    private val pendingPayloads = mutableListOf<JSONObject>()

    @Volatile
    private var instance: SilentPushEventEmitterModule? = null

    @Volatile
    private var listenerCount: Int = 0

    fun emitEvent(payload: JSONObject?) {
      val eventPayload = payload?.let { JSONObject(it.toString()) } ?: JSONObject()
      val currentInstance = instance

      if (currentInstance != null && currentInstance.hasListeners()) {
        Log.d(TAG, "Sending silent push event to JS immediately: $eventPayload")
        currentInstance.sendEvent(eventPayload)
        return
      }

      synchronized(pendingPayloads) {
        Log.d(TAG, "Queueing silent push payload until listeners attach: $eventPayload")
        pendingPayloads.add(eventPayload)
      }
    }
  }
}

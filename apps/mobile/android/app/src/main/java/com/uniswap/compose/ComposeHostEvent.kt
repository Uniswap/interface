package com.uniswap.compose

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

private class ComposeHostEvent(
  surfaceId: Int,
  viewTag: Int,
  private val name: String,
  private val payload: WritableMap?,
) : Event<ComposeHostEvent>(surfaceId, viewTag) {
  override fun getEventName(): String = name
  override fun getEventData(): WritableMap? = payload
  override fun canCoalesce(): Boolean = false
}

/**
 * Emits a custom view event to JS via Fabric's EventDispatcher. The legacy
 * getJSModule(RCTEventEmitter) path throws under the New Architecture (bridgeless).
 */
fun dispatchComposeHostEvent(reactContext: ReactContext, viewTag: Int, eventName: String, payload: WritableMap? = null) {
  // Derive surfaceId from the context, not the view: getSurfaceId(view) returns -1 for odd (legacy)
  // view tags, and surfaceId -1 makes Fabric fall back to RCTEventEmitter and re-throw.
  val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
  val dispatcher = UIManagerHelper.getEventDispatcher(reactContext) ?: return
  dispatcher.dispatchEvent(ComposeHostEvent(surfaceId, viewTag, eventName, payload))
}

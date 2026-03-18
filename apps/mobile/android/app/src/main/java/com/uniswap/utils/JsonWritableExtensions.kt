package com.uniswap.utils

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import org.json.JSONArray
import org.json.JSONObject

fun JSONObject.toWritableMap(): WritableMap {
  val map = Arguments.createMap()
  val iterator = keys()
  while (iterator.hasNext()) {
    val key = iterator.next()
    when (val value = opt(key)) {
      null, JSONObject.NULL -> map.putNull(key)
      is JSONObject -> map.putMap(key, value.toWritableMap())
      is JSONArray -> map.putArray(key, value.toWritableArray())
      is Boolean -> map.putBoolean(key, value)
      is Int -> map.putInt(key, value)
      is Long -> {
        if (value in Int.MIN_VALUE..Int.MAX_VALUE) {
          map.putInt(key, value.toInt())
        } else {
          map.putDouble(key, value.toDouble())
        }
      }
      is Double -> map.putDouble(key, value)
      is Float -> map.putDouble(key, value.toDouble())
      is Number -> map.putDouble(key, value.toDouble())
      is String -> map.putString(key, value)
      else -> map.putString(key, value.toString())
    }
  }
  return map
}

fun JSONArray.toWritableArray(): WritableArray {
  val array = Arguments.createArray()
  for (index in 0 until length()) {
    when (val value = opt(index)) {
      null, JSONObject.NULL -> array.pushNull()
      is JSONObject -> array.pushMap(value.toWritableMap())
      is JSONArray -> array.pushArray(value.toWritableArray())
      is Boolean -> array.pushBoolean(value)
      is Int -> array.pushInt(value)
      is Long -> {
        if (value in Int.MIN_VALUE..Int.MAX_VALUE) {
          array.pushInt(value.toInt())
        } else {
          array.pushDouble(value.toDouble())
        }
      }
      is Double -> array.pushDouble(value)
      is Float -> array.pushDouble(value.toDouble())
      is Number -> array.pushDouble(value.toDouble())
      is String -> array.pushString(value)
      else -> array.pushString(value.toString())
    }
  }
  return array
}

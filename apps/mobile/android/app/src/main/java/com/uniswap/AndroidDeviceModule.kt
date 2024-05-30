package com.uniswap

import androidx.core.performance.play.services.PlayServicesDevicePerformance
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod


/**
 * React module to provide device level information particular to Android
 */
class AndroidDeviceModule(reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
  override fun getName() = REACT_CLASS

  @ReactMethod
  fun getPerformanceClass(promise: Promise) {
    val devicePerformance = PlayServicesDevicePerformance(reactApplicationContext)
    promise.resolve(devicePerformance.mediaPerformanceClass)
  }
  companion object {
    private const val REACT_CLASS = "AndroidDeviceModule"
  }
}

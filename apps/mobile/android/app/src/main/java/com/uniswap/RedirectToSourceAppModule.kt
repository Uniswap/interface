package com.uniswap

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RedirectToSourceAppModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "RedirectToSourceApp" 
    }

    @ReactMethod
    fun moveAppToBackground() {
      currentActivity?.moveTaskToBack(true) 
  }
}

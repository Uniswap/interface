package com.uniswap
import android.app.Activity
import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Context
import android.content.res.Configuration

import androidx.appcompat.app.AppCompatDelegate

class ThemeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "ThemeModule"

  @ReactMethod fun setColorScheme(style: String) {
    val activity = currentActivity
    when (style) {
      "dark" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
      "light" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
      "system" -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
    }
    val isLightTheme = style == "light" || (style == "system" && !isSystemInDarkTheme(reactContext))
    if (activity != null) setBottomNavigationTheme(activity, isLightTheme)
  }
  companion object {
    fun setBottomNavigationTheme(activity: Activity, isLightTheme: Boolean) {
      val window = activity.window
      activity.runOnUiThread {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          window.setDecorFitsSystemWindows(false)
          window.insetsController?.let {
            it.setSystemBarsAppearance(
              if (isLightTheme) WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS else 0,
              WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
          }
        } else {
          //TODO: Deprecated method won't allow for dynamic switch so it's safer to hardcoded dark buttons layout
          @Suppress("DEPRECATION")
          window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
              or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            )
        }
      }
    }
    fun isSystemInDarkTheme(context: Context): Boolean {
      return when (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) {
        Configuration.UI_MODE_NIGHT_YES -> true
        Configuration.UI_MODE_NIGHT_NO -> false
        else -> false
      }
    }
  }
}

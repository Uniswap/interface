package com.uniswap

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String? {
        return "Uniswap"
    }

    // Required for react-navigation to work on Android
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
    }
}

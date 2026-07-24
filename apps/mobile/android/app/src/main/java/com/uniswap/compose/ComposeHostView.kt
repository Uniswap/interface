package com.uniswap.compose

import android.annotation.SuppressLint
import android.content.Context
import android.widget.FrameLayout
import androidx.compose.ui.platform.ComposeView

/**
 * Hosts a [ComposeView] for use as a Fabric React view.
 *
 * Fabric's SurfaceMountingManager measures mounted views before they attach to a window.
 * AbstractComposeView.onMeasure is final and force-creates the composition, which resolves the
 * window-scoped Recomposer and crashes ("Cannot locate windowRecomposer ... not attached to a
 * window") when measured off-window. We gate onMeasure so the child ComposeView is measured only
 * once attached, and re-drive measure/layout on requestLayout (Fabric swallows the native layout
 * request Compose fires when its content resizes). Mirrors RevenueCat's ComposeViewWrapper.
 */
class ComposeHostView(context: Context) : FrameLayout(context) {
  private var isAttached = false

  private val measureAndLayout = Runnable {
    if (isAttached) {
      measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
      )
      layout(left, top, right, bottom)
    }
  }

  fun setComposeView(view: ComposeView) {
    removeAllViews()
    addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    isAttached = true
    post { requestLayout() }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    isAttached = false
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (isAttached) {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    } else {
      setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))
    }
  }

  @SuppressLint("WrongCall")
  override fun requestLayout() {
    super.requestLayout()
    post(measureAndLayout)
  }
}

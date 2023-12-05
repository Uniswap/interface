import {
  AnimateStyle,
  Easing,
  EntryExitAnimationFunction,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// Because the animation spec is denominated in frames, but Reanimated only works with milliseconds, this object stores all the frame values as their millisecond value equivalent. The conversion assumes 60fps, using a formula of (1000 / 60) * frames. This lets us keep the code readable according to frame numbers without recomputing these values every time.
const FPMS = {
  29: 483.33,
  60: 1000,
  130: 2166.67,
  165: 2750,
  179: 2983.33,
  180: 3000,
  228: 3800,
  241: 4016.67,
  258: 4300,
  360: 6000,
}

// 1. QR slide up animation
// Moves QR code box from bottom to top and fades it in
//    - Moves QR from y:-64 to y:0 from frame 29 to frame 60
//    - Fades in QR from 0 to 1 opacity from frame 29 to frame 60
//    - Triggers etching video as a callback when complete
export const qrSlideUpAndFadeInConfig = {
  opacity: {
    startValue: 0,
    endValue: 1,
    delay: FPMS[29],
    duration: FPMS[60] - FPMS[29],
  },
  translateY: {
    startValue: 64,
    endValue: 0,
    delay: FPMS[29],
    duration: FPMS[60] - FPMS[29],
  },
}

// 2. QR scale in animation
// Scales QR code box from 80% to 100% scale from frame 130 to frame 179
const qrScaleInConfig = {
  scale: { startValue: 0.8, endValue: 1, delay: FPMS[130], duration: FPMS[179] - FPMS[130] },
}

export const qrScaleIn: EntryExitAnimationFunction = () => {
  'worklet'
  const animations: AnimateStyle<unknown> = {
    transform: [
      {
        scale: withDelay(
          qrScaleInConfig.scale.delay,
          withTiming(qrScaleInConfig.scale.endValue, {
            duration: qrScaleInConfig.scale.duration,
            easing: Easing.bezierFn(0.66, 0.0, 0.34, 1.0),
          })
        ),
      },
    ],
  }
  const initialValues: AnimateStyle<unknown> = {
    transform: [{ scale: qrScaleInConfig.scale.startValue }],
  }
  return {
    initialValues,
    animations,
  }
}

// 3. QR inner glow animation
// Animates inner glowing circle of QR code box to slowly fade in
// NOTE: for now, it animates the inner glow's blur amount, as a proxy for its size because to animate its size makes it hard to keep it centered in the canvas. In order to do so, we would need to run the computing of the inner glow's size on the UI thread instead of the JS thread in order to transform the x and y of the Canvas Group the Oval and Blur are inside of by the correct amount as it animates (size / 2).
// NOTE 2: the actual animation had to be kept coupled to the component because it would become too unwieldy to abstract it here.
export const qrInnerBlurConfig = {
  opacity: {
    startValue: 0,
    endValue: 1,
    delay: 0,
    duration: FPMS[360] - FPMS[180],
  },
  size: {
    startValue: 100,
    endValue: 25,
    delay: 0,
    duration: FPMS[360] - FPMS[180],
  },
}

// 4. Flash wipe animation
// Covers the etching video with a flash wipe animation
//    - Fades in flash wipe from 80% to 100% scale from frame 130 to frame 179
//    - Fades in flash wipe from 0% opacity to 100% opacity from frame 165 to frame 180
//    - Fades out flash wipe from 100% to 0% opacity from frame 180 to frame 228
export const flashWipeConfig = {
  scale: {
    startValue: 0.8,
    endValue: 1,
    delay: FPMS[130],
    duration: FPMS[179] - FPMS[130],
  },
  opacityIn: {
    startValue: 0,
    endValue: 1,
    delay: FPMS[165],
    duration: FPMS[180] - FPMS[165],
  },
  opacityOut: {
    startValue: 1,
    endValue: 0,
    delay: 0,
    duration: FPMS[228] - FPMS[180],
  },
}

export const flashWipeAnimation: EntryExitAnimationFunction = () => {
  'worklet'
  const animations: AnimateStyle<unknown> = {
    opacity: withSequence(
      withDelay(
        flashWipeConfig.opacityIn.delay,
        withTiming(flashWipeConfig.opacityIn.endValue, {
          duration: flashWipeConfig.opacityIn.duration,
          easing: Easing.bezierFn(0.4, 0.0, 0.68, 0.06),
        })
      ),
      withDelay(
        flashWipeConfig.opacityOut.delay,
        withTiming(flashWipeConfig.opacityOut.endValue, {
          duration: flashWipeConfig.opacityOut.duration,
          easing: Easing.bezierFn(0.66, 0.0, 0.34, 1.0),
        })
      )
    ),
    transform: [
      {
        scale: withDelay(
          flashWipeConfig.scale.delay,
          withTiming(flashWipeConfig.scale.endValue, { duration: flashWipeConfig.scale.duration })
        ),
      },
    ],
  }
  const initialValues: AnimateStyle<unknown> = {
    opacity: flashWipeConfig.opacityIn.startValue,
    transform: [{ scale: flashWipeConfig.scale.startValue }],
  }
  return {
    initialValues,
    animations,
  }
}

// 5. Video fade out
// Fades out video after flash wipe has covered etching video
export const videoFadeOut: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    opacity: withDelay(
      flashWipeConfig.opacityIn.delay + flashWipeConfig.opacityIn.duration,
      withTiming(0, { duration: 1, easing: Easing.bezierFn(0.4, 0.0, 0.68, 0.06) })
    ),
  }
  const initialValues = {
    opacity: 1,
  }
  return {
    initialValues,
    animations,
  }
}

// 6. QR top glow fade in
// Fades in glow on top of real QR code and unicon after flash wipe
export const realQrTopGlowFadeIn: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    opacity: withDelay(
      flashWipeConfig.opacityIn.delay,
      withTiming(flashWipeConfig.opacityIn.endValue, {
        duration: flashWipeConfig.opacityIn.duration,
        easing: Easing.bezierFn(0.4, 0.0, 0.68, 0.06),
      })
    ),
  }
  const initialValues = {
    opacity: 0,
  }
  return {
    initialValues,
    animations,
  }
}

// 7. Real QR code fade in
// Show the real QR code and Unicon after the flash wipe
export const realQrFadeIn: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    opacity: withDelay(
      flashWipeConfig.opacityIn.delay + flashWipeConfig.opacityIn.duration,
      withTiming(1, { duration: 1, easing: Easing.bezierFn(0.4, 0.0, 0.68, 0.06) })
    ),
  }
  const initialValues = {
    opacity: 0,
  }
  return {
    initialValues,
    animations,
  }
}

// 8. Text slide up and fade in
const textSlideUpAndFadeInConfig = {
  opacityIn: {
    startValue: 0,
    endValue: 1,
    delay: FPMS[241],
    duration: FPMS[241],
  },
  opacityOut: {
    startValue: 0,
    endValue: 1,
    delay: FPMS[241],
    duration: FPMS[258] - FPMS[241],
  },
  translateY: {
    startValue: 32,
    endValue: 0,
    delay: FPMS[228],
    duration: FPMS[258] - FPMS[228],
  },
}

export const textSlideUpAtEnd: EntryExitAnimationFunction = () => {
  'worklet'
  const animations: AnimateStyle<unknown> = {
    opacity: withDelay(
      textSlideUpAndFadeInConfig.opacityOut.delay,
      withTiming(textSlideUpAndFadeInConfig.opacityOut.endValue, {
        duration: textSlideUpAndFadeInConfig.opacityOut.duration,
        easing: Easing.bezierFn(0.66, 0.0, 0.34, 1.0),
      })
    ),
    transform: [
      {
        translateY: withDelay(
          textSlideUpAndFadeInConfig.translateY.delay,
          withTiming(textSlideUpAndFadeInConfig.translateY.endValue, {
            duration: textSlideUpAndFadeInConfig.translateY.duration,
            easing: Easing.bezierFn(0.66, 0.0, 0.34, 1.0),
          })
        ),
      },
    ],
  }
  const initialValues: AnimateStyle<unknown> = {
    transform: [{ translateY: textSlideUpAndFadeInConfig.translateY.startValue }],
    opacity: textSlideUpAndFadeInConfig.opacityOut.startValue,
  }
  return {
    initialValues,
    animations,
  }
}

// 9. Button slide up and fade in
export const letsGoButtonFadeIn: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    opacity: withDelay(
      textSlideUpAndFadeInConfig.opacityOut.delay,
      withTiming(textSlideUpAndFadeInConfig.opacityOut.endValue, {
        duration: textSlideUpAndFadeInConfig.opacityOut.duration,
      })
    ),
  }
  const initialValues = {
    opacity: textSlideUpAndFadeInConfig.opacityOut.startValue,
  }
  return {
    initialValues,
    animations,
  }
}

// 10. Whole QR container (showing real QR and Unicon now) slides up
const qrSlideUpAtEndConfig = {
  translateY: {
    startValue: 0,
    endValue: -64,
    delay: FPMS[228],
    duration: FPMS[258] - FPMS[228],
  },
}

export const qrSlideUpAtEnd: EntryExitAnimationFunction = () => {
  'worklet'
  const animations: AnimateStyle<unknown> = {
    transform: [
      {
        translateY: withDelay(
          qrSlideUpAtEndConfig.translateY.delay,
          withTiming(qrSlideUpAtEndConfig.translateY.endValue, {
            duration: qrSlideUpAtEndConfig.translateY.duration,
            easing: Easing.bezierFn(0.66, 0.0, 0.34, 1.0),
          })
        ),
      },
    ],
  }
  const initialValues: AnimateStyle<unknown> = {
    transform: [{ translateY: qrSlideUpAndFadeInConfig.translateY.startValue }],
  }
  return {
    initialValues,
    animations,
  }
}

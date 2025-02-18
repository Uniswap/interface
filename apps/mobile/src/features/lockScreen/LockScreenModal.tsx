import { BlurView } from 'expo-blur'
import React, { memo } from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { useLockScreenState } from 'src/features/lockScreen/useLockScreenState'
import { flexStyles, useIsDarkMode } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { zIndexes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isAndroid } from 'utilities/src/platform'

export const LockScreenModal = memo(function LockScreenModal(): JSX.Element | null {
  const { isLockScreenVisible, setIsLockScreenVisible } = useLockScreenState()
  const { trigger } = useBiometricPrompt(() => setIsLockScreenVisible(false))

  if (!isLockScreenVisible) {
    return null
  }

  // We do not add explicit error boundary here as we can not hide or replace
  // the lock screen on error, hence we fallback to the global error boundary
  return (
    <FullScreenFader>
      <TouchableWithoutFeedback style={flexStyles.fill} onPress={(): Promise<void> => trigger()}>
        <LockScreenModalContent />
      </TouchableWithoutFeedback>
    </FullScreenFader>
  )
})

const LockScreenModalContent = memo(function LockScreenModalContent(): JSX.Element {
  const isBlurredLockScreenEnabled = useFeatureFlag(FeatureFlags.BlurredLockScreen)

  const isDarkMode = useIsDarkMode()
  if (isBlurredLockScreenEnabled) {
    return (
      <BlurView
        experimentalBlurMethod={isAndroid ? 'dimezisBlurView' : undefined}
        intensity={60}
        tint={isDarkMode ? 'systemMaterialDark' : 'systemMaterialLight'}
        style={flexStyles.fill}
      />
    )
  }
  // fallback to splash screen if blurred lock screen is not enabled
  return <SplashScreen />
})

const FullScreenFader = memo(function FullScreenFader({ children }: { children: React.ReactNode }): JSX.Element {
  const dimensions = useDeviceDimensions()
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: dimensions.fullWidth,
        height: dimensions.fullHeight,
        zIndex: zIndexes.overlay,
      }}
    >
      {children}
    </Animated.View>
  )
})

import { BlurView } from 'expo-blur'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { SPLASH_SCREEN_IMAGE_SIZE, SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { useLockScreenState } from 'src/features/lockScreen/hooks/useLockScreenState'
import { Button, Flex, TouchableArea, flexStyles, useIsDarkMode } from 'ui/src'
import { UNISWAP_MONO_LOGO_LARGE } from 'ui/src/assets'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing, zIndexes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isAndroid } from 'utilities/src/platform'

const fadeIn = FadeIn.duration(250)
const fadeOut = FadeOut.duration(250)

export const LockScreenModal = memo(function LockScreenModal(): JSX.Element | null {
  const { isLockScreenVisible } = useLockScreenState()
  const { trigger } = useBiometricPrompt()
  const isBlurredLockScreenEnabled = useFeatureFlag(FeatureFlags.BlurredLockScreen)

  if (!isLockScreenVisible) {
    return null
  }

  // We do not add explicit error boundary here as we can not hide or replace
  // the lock screen on error, hence we fallback to the global error boundary
  return (
    <FullScreenFader>
      <TouchableArea activeOpacity={1} style={flexStyles.fill} onPress={(): Promise<void> => trigger()}>
        {isBlurredLockScreenEnabled ? (
          <BlurredLockScreen />
        ) : (
          // fallback to splash screen with unlock button
          <LegacySplashLockScreen />
        )}
      </TouchableArea>
    </FullScreenFader>
  )
})

const LegacySplashLockScreen = memo(function LegacySplashLockScreen(): JSX.Element {
  const { manualRetryRequired } = useLockScreenState()
  const bottomInset = useBottomInset()

  return (
    <>
      <SplashScreen />
      {manualRetryRequired && (
        <Flex position="absolute" top={0} left={0} right={0} bottom={0} justifyContent="flex-end" pb={bottomInset}>
          <UnlockButton />
        </Flex>
      )}
    </>
  )
})

const BlurredLockScreen = memo(function BlurredLockScreen(): JSX.Element {
  const { manualRetryRequired } = useLockScreenState()
  const isDarkMode = useIsDarkMode()
  const bottomInset = useBottomInset()
  const dimensions = useDeviceDimensions()

  return (
    <BlurView
      experimentalBlurMethod={isAndroid ? 'dimezisBlurView' : undefined}
      intensity={60}
      tint={isDarkMode ? 'systemMaterialDark' : 'systemMaterialLight'}
      style={flexStyles.fill}
    >
      <Image
        source={UNISWAP_MONO_LOGO_LARGE}
        style={{
          position: 'absolute',
          top: (dimensions.fullHeight - SPLASH_SCREEN_IMAGE_SIZE) / 2,
          left: (dimensions.fullWidth - SPLASH_SCREEN_IMAGE_SIZE) / 2,
          height: SPLASH_SCREEN_IMAGE_SIZE,
          width: SPLASH_SCREEN_IMAGE_SIZE,
        }}
      />
      {manualRetryRequired && (
        <Flex fill justifyContent="flex-end" pb={bottomInset}>
          <UnlockButton />
        </Flex>
      )}
    </BlurView>
  )
})

const UnlockButton = memo(function UnlockButton(): JSX.Element {
  const { trigger } = useBiometricPrompt()
  const { t } = useTranslation()
  const renderBiometricsIcon = useBiometricsIcon()

  return (
    <AnimatedFlex centered row px="$spacing24" entering={fadeIn} exiting={fadeOut}>
      <Button
        icon={renderBiometricsIcon ? renderBiometricsIcon({ color: '$neutral100' }) : undefined}
        size="large"
        emphasis="primary"
        variant="branded"
        onPress={(): Promise<void> => trigger()}
      >
        {t('common.button.unlock')}
      </Button>
    </AnimatedFlex>
  )
})

const FullScreenFader = memo(function FullScreenFader({ children }: { children: React.ReactNode }): JSX.Element {
  const dimensions = useDeviceDimensions()
  return (
    <Animated.View
      entering={fadeIn}
      exiting={fadeOut}
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

const useBottomInset = (): number => {
  const insets = useAppInsets()
  const additional = isAndroid ? spacing.spacing24 : 0
  return insets.bottom + additional
}

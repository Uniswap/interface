import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { Modal } from 'src/components/modals/Modal'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { Flex, TouchableArea, useDeviceDimensions, useDeviceInsets, useIsDarkMode } from 'ui/src'
import { UNISWAP_LOGO_LARGE } from 'ui/src/assets'
import { isAndroid } from 'uniswap/src/utils/platform'

export const SPLASH_SCREEN = { uri: 'SplashScreen' }

export function LockScreenModal(): JSX.Element | null {
  const { isLockScreenVisible, animationType, setIsLockScreenVisible } = useLockScreenContext()
  const { trigger } = useBiometricPrompt(() => setIsLockScreenVisible(false))
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()
  const isDarkMode = useIsDarkMode()

  if (!isLockScreenVisible) {
    return null
  }

  return (
    <Modal
      visible
      animationType={animationType}
      dimBackground={true}
      dismissable={false}
      pointerEvents="none"
      position="center"
      presentationStyle="fullScreen"
      showCloseButton={false}
      transparent={false}
      width="100%">
      <TouchableArea onPress={(): Promise<void> => trigger()}>
        <Flex
          alignItems="center"
          backgroundColor={isDarkMode ? '$surface1' : '$sporeWhite'}
          justifyContent={isAndroid ? 'center' : undefined}
          pointerEvents="none"
          style={{
            width: dimensions.fullWidth,
            height: dimensions.fullHeight,
            paddingBottom: insets.bottom,
          }}>
          {/* Android has a different implementation, which is not set in stone yet, so skipping it for now */}
          {isAndroid ? (
            <Image source={UNISWAP_LOGO_LARGE} style={style.logoStyle} />
          ) : (
            <Image
              resizeMode="contain"
              source={SPLASH_SCREEN}
              style={{
                width: dimensions.fullWidth,
                height: dimensions.fullHeight,
              }}
            />
          )}
        </Flex>
      </TouchableArea>
    </Modal>
  )
}

const style = StyleSheet.create({
  logoStyle: {
    height: 180,
    width: 165,
  },
})

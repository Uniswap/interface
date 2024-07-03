import React from 'react'
import { Modal } from 'src/components/modals/Modal'
import { SplashScreen } from 'src/features/appLoading/SplashScreen'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { TouchableArea, useDeviceInsets } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'

export const SPLASH_SCREEN = { uri: 'SplashScreen' }

export function LockScreenModal(): JSX.Element | null {
  const { isLockScreenVisible, animationType, setIsLockScreenVisible } = useLockScreenContext()
  const { trigger } = useBiometricPrompt(() => setIsLockScreenVisible(false))
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()

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
        <SplashScreen
          style={{
            width: dimensions.fullWidth,
            height: dimensions.fullHeight,
            paddingBottom: insets.bottom,
          }}
        />
      </TouchableArea>
    </Modal>
  )
}

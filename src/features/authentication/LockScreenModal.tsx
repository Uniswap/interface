import React from 'react'
import { Image } from 'react-native'
import { UNISWAP_SPLASH_LOGO } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Modal } from 'src/components/modals/Modal'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { dimensions } from 'src/styles/sizing'

export function LockScreenModal() {
  const { isLockScreenVisible, animationType, setIsLockScreenVisible } = useLockScreenContext()
  const { trigger } = useBiometricPrompt(() => setIsLockScreenVisible(false))

  return (
    <Modal
      animationType={animationType}
      dimBackground={true}
      dismissable={false}
      pointerEvents="none"
      position="center"
      presentationStyle="fullScreen"
      showCloseButton={false}
      transparent={false}
      visible={isLockScreenVisible}>
      <Button onPress={trigger}>
        <Box
          alignItems="center"
          backgroundColor="backgroundBackdrop"
          pointerEvents="none"
          style={{
            width: dimensions.fullWidth,
            height: dimensions.fullHeight,
            paddingTop: dimensions.fullHeight / 7, // just a placeholder, the faceid thing blocks the logo in the middle
          }}>
          <Image source={UNISWAP_SPLASH_LOGO} />
        </Box>
      </Button>
    </Modal>
  )
}

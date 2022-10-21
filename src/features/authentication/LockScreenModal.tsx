import React from 'react'
import { Image } from 'react-native'
import { UNISWAP_LOGO } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
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
        <Flex
          centered
          alignItems="center"
          backgroundColor="background0"
          pointerEvents="none"
          style={{
            width: dimensions.fullWidth,
            height: dimensions.fullHeight,
          }}>
          <Image source={UNISWAP_LOGO} />
        </Flex>
      </Button>
    </Modal>
  )
}

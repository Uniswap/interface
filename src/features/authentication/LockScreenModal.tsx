import React from 'react'
import { Image, StyleSheet } from 'react-native'
import { UNISWAP_LOGO_LARGE } from 'src/assets'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Modal } from 'src/components/modals/Modal'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { dimensions } from 'src/styles/sizing'

export function LockScreenModal() {
  const { isLockScreenVisible, animationType, setIsLockScreenVisible } = useLockScreenContext()
  const { trigger } = useBiometricPrompt(() => setIsLockScreenVisible(false))

  if (!isLockScreenVisible) return null

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
      transparent={false}>
      <TouchableArea onPress={() => trigger()}>
        <Flex
          centered
          alignItems="center"
          backgroundColor="background0"
          pointerEvents="none"
          style={{
            width: dimensions.fullWidth,
            height: dimensions.fullHeight,
          }}>
          <Image source={UNISWAP_LOGO_LARGE} style={style.logoStyle} />
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

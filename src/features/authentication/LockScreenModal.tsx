import React from 'react'
import { Image } from 'react-native'
import { UNISWAP_SPLASH_LOGO } from 'src/assets'
import { Box } from 'src/components/layout/Box'
import { Modal } from 'src/components/modals/Modal'
import { useLockScreenContext } from 'src/features/authentication/lockScreenContext'
import { dimensions } from 'src/styles/sizing'

export function LockScreenModal() {
  const { isLockScreenVisible } = useLockScreenContext()
  return (
    <Modal
      animationType="slide"
      dimBackground={true}
      dismissable={false}
      pointerEvents="none"
      position="center"
      presentationStyle="fullScreen"
      showCloseButton={false}
      transparent={false}
      visible={isLockScreenVisible}>
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
    </Modal>
  )
}

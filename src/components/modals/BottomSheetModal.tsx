import React, { PropsWithChildren } from 'react'
import { ViewStyle } from 'react-native'
import Modal, { Direction } from 'react-native-modal'
import { Box } from 'src/components/layout'

type Props = {
  isVisible: boolean
  children: PropsWithChildren<any>
  onClose: () => void
  disableSwipe?: boolean
  hideHandlebar?: boolean
}

const HandleBar = () => {
  return (
    <Box
      alignSelf="center"
      backgroundColor="gray400"
      borderRadius="xs"
      height={4}
      mt="sm"
      opacity={0.3}
      width={36}
    />
  )
}

const SWIPE_DOWN: Direction[] = ['down']

export function BottomSheetModal({
  isVisible,
  children,
  onClose,
  disableSwipe,
  hideHandlebar,
}: Props) {
  return (
    <Modal
      propagateSwipe
      isVisible={isVisible}
      style={modalStyle}
      swipeDirection={disableSwipe ? undefined : SWIPE_DOWN}
      swipeThreshold={50}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}>
      <Box backgroundColor="mainBackground" borderRadius="lg">
        {!hideHandlebar ? <HandleBar /> : null}
        {children}
      </Box>
    </Modal>
  )
}

const modalStyle: ViewStyle = {
  justifyContent: 'flex-end',
  margin: 0,
}

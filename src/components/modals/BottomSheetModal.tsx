import React, { PropsWithChildren } from 'react'
import { ViewStyle } from 'react-native'
import Modal, { Direction } from 'react-native-modal'
import { Box } from 'src/components/layout'
import { ModalName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'

type Props = {
  children: PropsWithChildren<any>
  disableSwipe?: boolean
  hideHandlebar?: boolean
  isVisible: boolean
  name: ModalName
  onClose: () => void
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
  name,
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
      <Trace logImpression section={name}>
        <Box backgroundColor="mainBackground" borderRadius="lg">
          {!hideHandlebar ? <HandleBar /> : null}
          {children}
        </Box>
      </Trace>
    </Modal>
  )
}

const modalStyle: ViewStyle = {
  justifyContent: 'flex-end',
  margin: 0,
}

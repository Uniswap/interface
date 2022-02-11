import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { PropsWithChildren, useEffect, useRef } from 'react'
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
  snapPoints?: Array<string | number>
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

const Backdrop = (props: BottomSheetBackdropProps) => {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.7} />
}

const DEFAULT_SNAP_POINTS = ['CONTENT_HEIGHT']

export function BottomSheetModal({ isVisible, children, name, onClose, snapPoints }: Props) {
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints || DEFAULT_SNAP_POINTS)

  useEffect(() => {
    if (isVisible) {
      modalRef.current?.present()
    } else {
      modalRef.current?.close()
    }
  }, [isVisible])

  return (
    <BaseModal
      ref={modalRef}
      backdropComponent={Backdrop}
      contentHeight={animatedContentHeight}
      handleComponent={HandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      onDismiss={onClose}>
      <Trace logImpression section={name}>
        <BottomSheetView onLayout={handleContentLayout}>
          <Box backgroundColor="mainBackground" borderRadius="lg">
            {children}
          </Box>
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

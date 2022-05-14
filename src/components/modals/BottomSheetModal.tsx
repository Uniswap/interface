import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { ComponentProps, PropsWithChildren, useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { ModalName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { dimensions } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

type Props = {
  children: PropsWithChildren<any>
  disableSwipe?: boolean
  hideHandlebar?: boolean
  isVisible: boolean
  name: ModalName
  onClose: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  fullScreen?: boolean
  backgroundColor?: keyof Theme['colors']
}

const HandleBar = () => {
  return (
    <Box
      alignSelf="center"
      backgroundColor="deprecated_gray400"
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

const CONTENT_HEIGHT_SNAP_POINTS = ['CONTENT_HEIGHT']
const FULL_HEIGHT = 0.93
const FULL_HEIGHT_SNAP_POINTS = ['93%']

export function BottomSheetModal({
  isVisible,
  children,
  name,
  onClose,
  snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
  fullScreen,
  hideHandlebar,
  backgroundColor,
}: Props) {
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const theme = useAppTheme()

  useEffect(() => {
    if (isVisible) {
      modalRef.current?.present()
    } else {
      modalRef.current?.close()
    }
  }, [isVisible])

  if (!isVisible) return null

  const fullScreenContentHeight = FULL_HEIGHT * dimensions.fullHeight
  return (
    <BaseModal
      ref={modalRef}
      backdropComponent={Backdrop}
      backgroundStyle={{ backgroundColor: backgroundColor ?? theme.colors.mainBackground }}
      contentHeight={animatedContentHeight}
      handleComponent={hideHandlebar ? null : HandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      onDismiss={onClose}>
      <Trace logImpression section={name}>
        <BottomSheetView
          style={[
            { height: fullScreen ? fullScreenContentHeight : undefined },
            BottomSheetStyle.view,
          ]}
          onLayout={handleContentLayout}>
          {children}
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

export function BottomSheetScrollModal({
  isVisible,
  children,
  name,
  onClose,
  snapPoints = FULL_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
}: Props) {
  const modalRef = useRef<BaseModal>(null)

  const theme = useAppTheme()

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
      backgroundStyle={{ backgroundColor: theme.colors.mainBackground }}
      handleComponent={HandleBar}
      snapPoints={snapPoints}
      stackBehavior={stackBehavior}
      onDismiss={onClose}>
      <Trace logImpression section={name}>
        <BottomSheetScrollView>{children}</BottomSheetScrollView>
      </Trace>
    </BaseModal>
  )
}

const BottomSheetStyle = StyleSheet.create({
  view: {
    flex: 1,
  },
})

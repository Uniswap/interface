import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { ComponentProps, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { ModalName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { dimensions, spacing } from 'src/styles/sizing'

type Props = {
  children: PropsWithChildren<any>
  disableSwipe?: boolean
  hideHandlebar?: boolean
  isVisible: boolean
  name: ModalName
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  fullScreen?: boolean
  backgroundColor?: string
  isDismissible?: boolean
}

const HandleBar = () => {
  return (
    <Box
      alignSelf="center"
      backgroundColor="backgroundAction"
      borderRadius="xs"
      height={4}
      mb="sm"
      mt="md"
      width={32}
    />
  )
}

const Backdrop = (props: BottomSheetBackdropProps) => {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
}

const CONTENT_HEIGHT_SNAP_POINTS = ['CONTENT_HEIGHT']
const FULL_HEIGHT = 0.91
const FULL_HEIGHT_SNAP_POINTS = ['91%']

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
  isDismissible = true,
}: Props) {
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const theme = useAppTheme()

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior={isDismissible ? 'close' : 'none'}
      />
    ),
    [isDismissible]
  )

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
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: backgroundColor ?? theme.colors.backgroundSurface }}
      contentHeight={animatedContentHeight}
      enableContentPanningGesture={isDismissible}
      enableHandlePanningGesture={isDismissible}
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
      backgroundStyle={{ backgroundColor: theme.colors.backgroundBackdrop }}
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

export function BottomSheetDetachedModal({
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
      backgroundStyle={{ backgroundColor: backgroundColor ?? theme.colors.backgroundBackdrop }}
      bottomInset={theme.spacing.xxl}
      contentHeight={animatedContentHeight}
      detached={true}
      handleComponent={hideHandlebar ? null : HandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      style={BottomSheetStyle.detached}
      onDismiss={onClose}>
      <Trace logImpression section={name}>
        <BottomSheetView
          style={[
            {
              height: fullScreen ? fullScreenContentHeight : undefined,
            },
            BottomSheetStyle.view,
          ]}
          onLayout={handleContentLayout}>
          {children}
        </BottomSheetView>
      </Trace>
    </BaseModal>
  )
}

const BottomSheetStyle = StyleSheet.create({
  detached: {
    marginHorizontal: spacing.sm,
  },
  view: {
    flex: 1,
  },
})

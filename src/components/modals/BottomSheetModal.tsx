import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal as BaseModal,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { ComponentProps, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { ModalName } from 'src/features/telemetry/constants'
import { TelemetryTraceProps } from 'src/features/telemetry/types'
import { dimensions, spacing } from 'src/styles/sizing'

type Props = PropsWithChildren<{
  disableSwipe?: boolean
  hideHandlebar?: boolean
  name: ModalName
  onClose?: () => void
  snapPoints?: Array<string | number>
  stackBehavior?: ComponentProps<typeof BaseModal>['stackBehavior']
  fullScreen?: boolean
  backgroundColor?: string
  isDismissible?: boolean
}> &
  TelemetryTraceProps

const HANDLEBAR_HEIGHT = spacing.spacing4
const HANDLEBAR_WIDTH = spacing.spacing36

const HandleBar = ({
  backgroundColor,
  hidden,
}: {
  // string instead of keyof Theme['colors] because this is passed down from the modal
  // backgroundColor prop which expects an actual hex string instead of a named color
  backgroundColor: string
  hidden: boolean
}): JSX.Element => {
  const theme = useAppTheme()
  const bg = hidden ? 'transparent' : backgroundColor ?? theme.colors.background0

  return (
    <Flex
      alignItems="center"
      borderRadius="rounded20"
      justifyContent="center"
      style={{
        backgroundColor: bg,
      }}>
      <Box
        alignSelf="center"
        backgroundColor={hidden ? 'none' : 'backgroundOutline'}
        borderRadius="rounded8"
        height={HANDLEBAR_HEIGHT}
        mb="spacing12"
        mt="spacing16"
        width={HANDLEBAR_WIDTH}
      />
    </Flex>
  )
}

const Backdrop = (props: BottomSheetBackdropProps): JSX.Element => {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
}

const CONTENT_HEIGHT_SNAP_POINTS = ['CONTENT_HEIGHT']
const FULL_HEIGHT = 0.91

export function BottomSheetModal({
  children,
  name,
  properties,
  onClose,
  snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
  fullScreen,
  hideHandlebar,
  backgroundColor,
  isDismissible = true,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
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

  const renderHandleBar = useCallback(
    (props) => {
      return <HandleBar {...props} backgroundColor={backgroundColor} hidden={hideHandlebar} />
    },
    [backgroundColor, hideHandlebar]
  )

  useEffect(() => {
    modalRef.current?.present()
  }, [modalRef])

  const fullScreenContentHeight = FULL_HEIGHT * dimensions.fullHeight

  return (
    <BaseModal
      ref={modalRef}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: backgroundColor ?? theme.colors.background1 }}
      contentHeight={animatedContentHeight}
      enableContentPanningGesture={isDismissible}
      enableHandlePanningGesture={isDismissible}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      topInset={insets.top}
      onDismiss={onClose}>
      <Trace logImpression modal={name} properties={properties}>
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

export function BottomSheetDetachedModal({
  children,
  name,
  onClose,
  snapPoints = CONTENT_HEIGHT_SNAP_POINTS,
  stackBehavior = 'push',
  fullScreen,
  hideHandlebar,
  backgroundColor,
}: Props): JSX.Element {
  const insets = useSafeAreaInsets()
  const modalRef = useRef<BaseModal>(null)
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(snapPoints)
  const theme = useAppTheme()

  const fullScreenContentHeight = FULL_HEIGHT * dimensions.fullHeight

  useEffect(() => {
    modalRef.current?.present()
  }, [modalRef])

  const renderHandleBar = useCallback(
    (props) => {
      return <HandleBar {...props} backgroundColor={backgroundColor} hidden={hideHandlebar} />
    },
    [backgroundColor, hideHandlebar]
  )

  return (
    <BaseModal
      ref={modalRef}
      backdropComponent={Backdrop}
      backgroundStyle={{ backgroundColor: backgroundColor ?? theme.colors.background0 }}
      bottomInset={theme.spacing.spacing48}
      contentHeight={animatedContentHeight}
      detached={true}
      handleComponent={renderHandleBar}
      handleHeight={animatedHandleHeight}
      snapPoints={animatedSnapPoints}
      stackBehavior={stackBehavior}
      style={BottomSheetStyle.detached}
      topInset={insets.top}
      onDismiss={onClose}>
      <Trace logImpression modal={name}>
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
    marginHorizontal: spacing.spacing12,
  },
  view: {
    flex: 1,
  },
})

import { BottomSheetFooter, BottomSheetScrollView, useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PropsWithChildren, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  MeasureLayoutOnSuccessCallback,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import { AnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ScrollDownOverlay } from 'src/components/Requests/ModalWithOverlay/ScrollDownOverlay'
import { Button, ButtonProps, Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const MEASURE_LAYOUT_TIMEOUT = 100

export type ModalWithOverlayProps = PropsWithChildren<
  ModalProps & {
    confirmationButtonText?: string
    cancelButtonText?: string
    scrollDownButtonText?: string
    onReject: () => void
    onConfirm?: () => void
    disableConfirm?: boolean
    confirmationLoading?: boolean
    contentContainerStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>
    cancelButtonProps?: ButtonProps
    confirmationButtonProps?: ButtonProps
  }
>

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent): boolean => {
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - spacing.spacing24
}

export function ModalWithOverlay({
  children,
  confirmationButtonText,
  cancelButtonText,
  scrollDownButtonText,
  onReject,
  onConfirm,
  disableConfirm,
  confirmationLoading,
  contentContainerStyle,
  cancelButtonProps,
  confirmationButtonProps,
  ...bottomSheetModalProps
}: ModalWithOverlayProps): JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null)
  const contentViewRef = useRef<View>(null)
  const measureLayoutTimeoutRef = useRef<NodeJS.Timeout>()

  const startedScrollingRef = useRef(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [confirmationEnabled, setConfirmationEnabled] = useState(false)

  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      startedScrollingRef.current = true
      if (showOverlay) {
        setShowOverlay(false)
      }
      if (isCloseToBottom(nativeEvent)) {
        setConfirmationEnabled(true)
      }
    },
    [showOverlay],
  )

  const handleScrollDown = useCallback(() => {
    scrollViewRef.current?.scrollToEnd()
  }, [])

  const measureContent = useCallback((parentHeight: number) => {
    // eslint-disable-next-line max-params
    const onSuccess: MeasureLayoutOnSuccessCallback = (x, y, w, h) => {
      if (h > parentHeight) {
        setShowOverlay(!startedScrollingRef.current)
      } else {
        setConfirmationEnabled(true)
      }
    }

    const contentNode = contentViewRef.current

    if (contentNode) {
      contentNode.measure(onSuccess)
    } else {
      setConfirmationEnabled(true)
    }
  }, [])

  const handleScrollViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const parentHeight = e.nativeEvent.layout.height
      if (measureLayoutTimeoutRef.current) {
        clearTimeout(measureLayoutTimeoutRef.current)
      }
      // BottomSheetScrollView calls onLayout multiple times with different
      // height values. In order to make a correct measurement, we have to
      // ignore all measurements except the last one, thus we add the timeout
      // to cancel measurements when onLayout is called within a small interval
      measureLayoutTimeoutRef.current = setTimeout(() => {
        measureContent(parentHeight)
      }, MEASURE_LAYOUT_TIMEOUT)
    },
    [measureContent],
  )

  const eip5792MethodsEnabled = useFeatureFlag(FeatureFlags.Eip5792Methods)

  return (
    <Modal overrideInnerContainer {...bottomSheetModalProps}>
      <BottomSheetScrollView
        ref={scrollViewRef}
        contentContainerStyle={
          contentContainerStyle ?? {
            paddingHorizontal: spacing.spacing24,
            paddingTop: spacing.spacing12,
          }
        }
        showsVerticalScrollIndicator={false}
        onLayout={handleScrollViewLayout}
        onScroll={handleScroll}
      >
        <Flex ref={contentViewRef}>{children}</Flex>
      </BottomSheetScrollView>

      <ModalFooter
        cancelButtonText={cancelButtonText}
        confirmationButtonText={confirmationButtonText}
        confirmationEnabled={!disableConfirm && confirmationEnabled}
        confirmationLoading={confirmationLoading}
        scrollDownButtonText={scrollDownButtonText}
        showScrollDownOverlay={showOverlay && !eip5792MethodsEnabled}
        cancelButtonProps={cancelButtonProps}
        confirmationButtonProps={confirmationButtonProps}
        onConfirm={onConfirm}
        onReject={onReject}
        onScrollDownPress={handleScrollDown}
      />
    </Modal>
  )
}

type ModalFooterProps = {
  confirmationEnabled: boolean
  confirmationLoading?: boolean
  showScrollDownOverlay: boolean
  cancelButtonText?: string
  confirmationButtonText?: string
  scrollDownButtonText?: string
  cancelButtonProps?: ButtonProps
  confirmationButtonProps?: ButtonProps
  onScrollDownPress: () => void
  onReject: () => void
  onConfirm?: () => void
}

function ModalFooter({
  confirmationEnabled,
  confirmationLoading,
  showScrollDownOverlay,
  scrollDownButtonText,
  cancelButtonText,
  confirmationButtonText,
  cancelButtonProps,
  confirmationButtonProps,
  onScrollDownPress,
  onReject,
  onConfirm,
}: ModalFooterProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const { animatedPosition, animatedHandleHeight, animatedFooterHeight, animatedContainerHeight } =
    useBottomSheetInternal()

  // Calculate position of the modal footer to ensure it stays at the bottom of the screen
  // when the modal content is scrolled
  const animatedFooterPosition = useDerivedValue(
    () =>
      Math.max(0, animatedContainerHeight.value - animatedPosition.value) -
      animatedFooterHeight.value -
      animatedHandleHeight.value,
  )

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      {showScrollDownOverlay && (
        <ScrollDownOverlay scrollDownButonText={scrollDownButtonText} onScrollDownPress={onScrollDownPress} />
      )}

      <Flex
        row
        backgroundColor="$surface1"
        gap="$spacing8"
        pb={insets.bottom + spacing.spacing12}
        pt="$spacing12"
        px="$spacing24"
      >
        <Button size="large" testID={TestID.Cancel} emphasis="tertiary" onPress={onReject} {...cancelButtonProps}>
          {cancelButtonText ?? t('common.button.cancel')}
        </Button>

        {confirmationButtonText && (
          <Button
            variant="branded"
            isDisabled={!confirmationEnabled}
            loading={confirmationLoading}
            size="large"
            testID={TestID.Confirm}
            onPress={onConfirm}
            {...confirmationButtonProps}
          >
            {confirmationButtonText}
          </Button>
        )}
      </Flex>
    </BottomSheetFooter>
  )
}

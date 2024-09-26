import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
/* eslint-disable-next-line no-restricted-imports */
import { type View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  ImpactFeedbackStyle,
  Portal,
  TouchableArea,
  isWeb,
  styled,
  useDeviceInsets,
  useIsDarkMode,
} from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing, zIndices } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { Scrollbar } from 'uniswap/src/components/misc/Scrollbar'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { isAndroid, isInterface, isTouchable } from 'utilities/src/platform'

const DEFAULT_MIN_WIDTH = 225

type LayoutMeasurements = {
  x: number
  y: number
  width: number
  height: number
}

type DropdownState = {
  isOpen: boolean
  toggleMeasurements: (LayoutMeasurements & { sticky?: boolean }) | null
}

export type ActionSheetDropdownStyleProps = {
  alignment?: 'left' | 'right'
  sticky?: boolean
  buttonPaddingX?: FlexProps['px']
  buttonPaddingY?: FlexProps['py']
  dropdownMaxHeight?: number
  dropdownZIndex?: FlexProps['zIndex']
}

type ActionSheetDropdownProps = PropsWithChildren<{
  options: MenuItemProp[]
  styles?: ActionSheetDropdownStyleProps & { backdropOpacity?: number }
  testID?: string
  onDismiss?: () => void
  showArrow?: boolean
  closeOnSelect?: boolean
}>

export function ActionSheetDropdown({
  children,
  styles,
  testID,
  onDismiss,
  showArrow,
  closeOnSelect = true,
  ...contentProps
}: ActionSheetDropdownProps): JSX.Element {
  const insets = useDeviceInsets()
  const containerRef = useRef<View>(null)
  const [{ isOpen, toggleMeasurements }, setState] = useState<DropdownState>({
    isOpen: false,
    toggleMeasurements: null,
  })

  const openDropdown = (): void => {
    onDismiss?.()

    const containerNode = containerRef?.current

    if (containerNode) {
      containerNode.measureInWindow((x, y, width, height) => {
        setState({
          isOpen: true,
          toggleMeasurements: {
            x,
            y: y + (isAndroid ? insets.top : 0),
            width,
            height,
            sticky: styles?.sticky,
          },
        })
      })
    }
  }

  useEffect(() => {
    if (!isWeb) {
      return
    }

    function resizeListener(): void {
      containerRef?.current?.measureInWindow((x, y, width, height) => {
        setState((prev) => ({
          ...prev,
          toggleMeasurements: {
            ...prev.toggleMeasurements,
            x,
            y,
            width,
            height,
          },
        }))
      })
    }

    window.addEventListener('resize', resizeListener)

    return () => {
      window.removeEventListener('resize', resizeListener)
    }
  }, [toggleMeasurements?.sticky, insets.top])

  const closeDropdown = (): void => {
    setState({ isOpen: false, toggleMeasurements: null })
  }

  return (
    <>
      <TouchableArea hapticFeedback hapticStyle={ImpactFeedbackStyle.Light} onPress={openDropdown}>
        {/* collapsable property prevents removing view on Android. Without this property we were
        getting undefined in measureInWindow callback. (https://reactnative.dev/docs/view.html#collapsable-android) */}
        <Flex
          ref={containerRef}
          centered
          row
          collapsable={false}
          gap="$spacing8"
          px={styles?.buttonPaddingX}
          py={styles?.buttonPaddingY || '$spacing8'}
          testID={testID || 'dropdown-toggle'}
        >
          {children}
          {showArrow && (
            <RotatableChevron
              animation="100ms"
              color="$neutral2"
              direction={isOpen ? 'up' : 'down'}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </Flex>
      </TouchableArea>

      <Portal zIndex={styles?.dropdownZIndex || zIndices.popover}>
        <AnimatePresence custom={{ isOpen }}>
          {isOpen && toggleMeasurements && (
            <>
              <Backdrop
                handleClose={closeDropdown}
                opacity={!isInterface || isTouchable ? styles?.backdropOpacity : 0}
              />
              <DropdownContent
                {...contentProps}
                alignment={styles?.alignment}
                dropdownMaxHeight={styles?.dropdownMaxHeight}
                handleClose={closeDropdown}
                toggleMeasurements={toggleMeasurements}
                closeOnSelect={closeOnSelect}
              />
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}

type DropdownContentProps = FlexProps & {
  options: MenuItemProp[]
  alignment?: 'left' | 'right'
  dropdownMaxHeight?: number
  toggleMeasurements: LayoutMeasurements & { sticky?: boolean }
  handleClose?: () => void
  closeOnSelect: boolean
}

/**
 * AnimatePresence `custom` prop will update variants *as* the exit animation runs,
 * which otherwise is impossible. We want to make sure people can touch behind the dropdown
 * as its animating closed. With slow animations it can be especially annoying.
 */
const TouchableWhenOpen = styled(Flex, {
  variants: {
    isOpen: {
      true: {
        pointerEvents: 'auto',
      },
      false: {
        pointerEvents: 'none',
      },
    },
  },
})

function DropdownContent({
  options,
  alignment = 'left',
  dropdownMaxHeight,
  toggleMeasurements,
  handleClose,
  closeOnSelect,
  ...rest
}: DropdownContentProps): JSX.Element {
  const insets = useDeviceInsets()
  const { fullWidth, fullHeight } = useDeviceDimensions()

  const scrollOffset = useSharedValue(0)
  const [contentHeight, setContentHeight] = useState(0)

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y
  })

  const containerProps = useMemo<FlexProps>(() => {
    if (alignment === 'left') {
      return {
        left: toggleMeasurements.x,
        right: 'unset',
        maxWidth: fullWidth - toggleMeasurements.x - spacing.spacing12,
      }
    }
    return {
      left: 'unset',
      right: fullWidth - (toggleMeasurements.x + toggleMeasurements.width),
      maxWidth: toggleMeasurements.x + toggleMeasurements.width - spacing.spacing12,
    }
  }, [alignment, fullWidth, toggleMeasurements])

  const bottomOffset = insets.bottom + spacing.spacing12
  const maxHeight =
    (isInterface && dropdownMaxHeight) ||
    Math.max(fullHeight - toggleMeasurements.y - toggleMeasurements.height - bottomOffset, 0)
  const overflowsContainer = contentHeight > maxHeight

  const initialScrollY = useMemo(() => window.scrollY, [])
  const [windowScrollY, setWindowScrollY] = useState(0)
  useEffect(() => {
    if (!isWeb) {
      return
    }

    function scrollListener(): void {
      if (!toggleMeasurements?.sticky && window.scrollY >= 0) {
        setWindowScrollY(window.scrollY - initialScrollY)
      }
    }
    window.addEventListener('scroll', scrollListener)
    return () => {
      window.removeEventListener('scroll', scrollListener)
    }
  }, [initialScrollY, toggleMeasurements?.sticky])

  useEffect(() => {
    if (toggleMeasurements) {
      setWindowScrollY(0)
    }
  }, [toggleMeasurements])

  return (
    <TouchableWhenOpen
      animation="quicker"
      maxHeight={maxHeight}
      minWidth={DEFAULT_MIN_WIDTH}
      position="absolute"
      testID="dropdown-content"
      top={toggleMeasurements.y + toggleMeasurements.height - windowScrollY}
      {...containerProps}
    >
      <BaseCard.Shadow
        animation="fast"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth={1}
        enterStyle={{ y: -20, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        overflow="hidden"
        p="$none"
        {...rest}
      >
        <Flex row maxHeight={maxHeight}>
          <Animated.ScrollView
            contentContainerStyle={{
              padding: spacing.spacing8,
            }}
            scrollEnabled={overflowsContainer}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={isWeb}
            onScroll={scrollHandler}
          >
            <Flex
              onLayout={({
                nativeEvent: {
                  layout: { height },
                },
              }) => {
                setContentHeight(height)
              }}
            >
              {options.map(({ key, onPress, render }: MenuItemProp) => (
                <TouchableArea
                  key={key}
                  hapticFeedback
                  hoverable
                  borderRadius="$rounded8"
                  onPress={() => {
                    onPress()
                    if (closeOnSelect) {
                      handleClose?.()
                    }
                  }}
                >
                  <Flex testID={key}>{render()}</Flex>
                </TouchableArea>
              ))}
            </Flex>
          </Animated.ScrollView>

          {/* Custom scrollbar to ensure it is visible on iOS and Android even if not scrolling
        and to be able to customize its appearance */}
          {overflowsContainer && !isWeb && (
            <Scrollbar
              contentHeight={contentHeight}
              mr="$spacing4"
              py="$spacing12"
              scrollOffset={scrollOffset}
              visibleHeight={maxHeight}
            />
          )}
        </Flex>
      </BaseCard.Shadow>
    </TouchableWhenOpen>
  )
}

type BackdropProps = {
  opacity?: number
  handleClose?: () => void
}

function Backdrop({ handleClose, opacity: opacityProp }: BackdropProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const opacity = opacityProp ?? (isDarkMode ? 0.4 : 0.2)

  return (
    <TouchableWhenOpen
      animation="100ms"
      backgroundColor="$black"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      flex={1}
      inset={0}
      opacity={opacity}
      position="absolute"
      testID="dropdown-backdrop"
      onPress={handleClose}
    />
  )
}

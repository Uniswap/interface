import { memo, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { View } from 'react-native'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { GestureResponderEvent } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  OverKeyboardContent,
  Portal,
  styled,
  TouchableArea,
  useIsDarkMode,
} from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing, zIndexes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { Scrollbar } from 'uniswap/src/components/misc/Scrollbar'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isAndroid, isTouchable, isWebApp, isWebPlatform } from 'utilities/src/platform'
import { executeWithFrameDelay } from 'utilities/src/react/delayUtils'
import { useTimeout } from 'utilities/src/time/timing'

const DEFAULT_MIN_WIDTH = 225
const MIN_HEIGHT = 250

type LayoutMeasurements = {
  x: number
  y: number
  width: number
  height: number
}

type ToggleMeasurements = (LayoutMeasurements & { sticky?: boolean }) | null

export type ActionSheetDropdownStyleProps = {
  alignment?: 'left' | 'right'
  sticky?: boolean
  buttonPaddingX?: FlexProps['px']
  buttonPaddingY?: FlexProps['py']
  dropdownMaxHeight?: number
  dropdownMinWidth?: number
  dropdownZIndex?: FlexProps['zIndex']
  dropdownGap?: FlexProps['gap']
  width?: FlexProps['width']
}

type ActionSheetDropdownProps = PropsWithChildren<{
  options: MenuItemProp[]
  styles?: ActionSheetDropdownStyleProps & { backdropOpacity?: number }
  testID?: string
  showArrow?: boolean
  closeOnSelect?: boolean
  onPress?: FlexProps['onPress']
}>

export function ActionSheetDropdown({
  children,
  styles,
  testID,
  showArrow,
  closeOnSelect = true,
  onPress,
  ...contentProps
}: ActionSheetDropdownProps): JSX.Element {
  const insets = useAppInsets()
  const containerRef = useRef<View>(null)
  const [isOpen, setOpen] = useState(false)
  const [toggleMeasurements, setToggleMeasurements] = useState<ToggleMeasurements | null>(null)

  const openDropdown = (event: GestureResponderEvent): void => {
    onPress?.(event)

    const containerNode = containerRef.current

    if (containerNode) {
      // eslint-disable-next-line max-params
      containerNode.measureInWindow((x, y, width, height) => {
        setToggleMeasurements({
          x,
          y: y + (isAndroid ? insets.top : 0),
          width,
          height,
          sticky: styles?.sticky,
        })
        setOpen(true)
      })
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: +toggleMeasurements?.sticky, insets.top
  useEffect(() => {
    if (!isWebPlatform) {
      return undefined
    }

    function resizeListener(): void {
      // eslint-disable-next-line max-params
      containerRef.current?.measureInWindow((x, y, width, height) => {
        setToggleMeasurements((prev) => ({
          ...prev,
          x,
          y,
          width,
          height,
        }))
      })
    }

    window.addEventListener('resize', resizeListener)

    return () => {
      window.removeEventListener('resize', resizeListener)
    }
  }, [toggleMeasurements?.sticky, insets.top])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +setOpen, setToggleMeasurements
  const closeDropdown = useCallback(
    (event: GestureResponderEvent): void => {
      setOpen(false)
      setToggleMeasurements(null)
      event.preventDefault()
      event.stopPropagation()
    },
    [setOpen, setToggleMeasurements],
  )

  return (
    <>
      <TouchableArea width={styles?.width} onPress={openDropdown}>
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
      <ActionSheetBackdropWithContent
        closeDropdown={closeDropdown}
        styles={styles}
        isOpen={isOpen}
        toggleMeasurements={toggleMeasurements}
        contentProps={contentProps}
        closeOnSelect={closeOnSelect}
      />
    </>
  )
}

const ActionSheetBackdropWithContent = memo(function ActionSheetBackdropWithContent({
  closeDropdown,
  styles,
  isOpen,
  toggleMeasurements,
  contentProps,
  closeOnSelect,
}: {
  closeDropdown: FlexProps['onPress']
  styles?: ActionSheetDropdownStyleProps & { backdropOpacity?: number }
  isOpen: boolean
  toggleMeasurements: ToggleMeasurements
  contentProps: ActionSheetDropdownProps
  closeOnSelect: boolean
}): JSX.Element | null {
  /*
    There is a race condition when we switch from a view with one Portal to another view with a Portal.
    It seems that if we mount a second Portal while the first is still mounted, the second would not work properly.
    setTimeout with 0ms is a workaround to avoid this issue for now
    Remove when https://linear.app/uniswap/issue/WALL-4817 is resolved
  */
  const [shouldRender, setShouldRender] = useState(false)
  useTimeout(() => setShouldRender(true), 0)

  if (!shouldRender) {
    return null
  }

  return (
    <Portal zIndex={styles?.dropdownZIndex || zIndexes.popover}>
      <AnimatePresence custom={{ isOpen }}>
        {toggleMeasurements && (
          <>
            <OverKeyboardContent visible={isOpen}>
              <Backdrop handleClose={closeDropdown} opacity={!isWebApp || isTouchable ? styles?.backdropOpacity : 0} />
              <DropdownContent
                {...contentProps}
                alignment={styles?.alignment}
                dropdownMaxHeight={styles?.dropdownMaxHeight}
                dropdownMinWidth={styles?.dropdownMinWidth}
                dropdownGap={styles?.dropdownGap}
                handleClose={closeDropdown}
                toggleMeasurements={toggleMeasurements}
                closeOnSelect={closeOnSelect}
              />
            </OverKeyboardContent>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
})

type DropdownContentProps = FlexProps & {
  options: MenuItemProp[]
  alignment?: 'left' | 'right'
  dropdownMaxHeight?: number
  dropdownMinWidth?: number
  dropdownGap?: FlexProps['gap']
  toggleMeasurements: LayoutMeasurements & { sticky?: boolean }
  handleClose?: FlexProps['onPress']
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
  dropdownMinWidth,
  dropdownGap,
  toggleMeasurements,
  handleClose,
  closeOnSelect,
  ...rest
}: DropdownContentProps): JSX.Element {
  const insets = useAppInsets()
  const { fullWidth, fullHeight } = useDeviceDimensions()

  const scrollOffset = useSharedValue(0)
  const [contentHeight, setContentHeight] = useState(0)

  const scrollHandler = useAnimatedScrollHandler(
    (event) => (scrollOffset.value = event.contentOffset.y),
    // There seems to be a bug in `reanimated` that's causing the dependency array to not be automatically injected by the babel plugin,
    // but it causes a crash when manually added on web. This is a workaround until the bug is fixed.
    // The performance impact of not having the array is minimal on web, so this should be fine for now.
    isWebPlatform ? undefined : [scrollOffset],
  )

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
    (isWebApp && dropdownMaxHeight) ||
    Math.max(fullHeight - toggleMeasurements.y - toggleMeasurements.height - bottomOffset, MIN_HEIGHT)
  const overflowsContainer = contentHeight > maxHeight

  const initialScrollY = useMemo(() => window.scrollY, [])
  const [windowScrollY, setWindowScrollY] = useState(0)
  useEffect(() => {
    if (!isWebPlatform) {
      return undefined
    }

    function scrollListener(): void {
      if (!toggleMeasurements.sticky && window.scrollY >= 0) {
        setWindowScrollY(window.scrollY - initialScrollY)
      }
    }
    window.addEventListener('scroll', scrollListener)
    return () => {
      window.removeEventListener('scroll', scrollListener)
    }
  }, [initialScrollY, toggleMeasurements.sticky])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +toggleMeasurements
  useEffect(() => {
    setWindowScrollY(0)
  }, [toggleMeasurements])

  const position = useMemo((): { top?: number; bottom?: number } => {
    // top is used to position the dropdown when it is opened below the toggle
    const top = toggleMeasurements.y + toggleMeasurements.height - windowScrollY + spacing.spacing8
    // bottom is used to position the dropdown when it is opened above the toggle
    const bottom = fullHeight - toggleMeasurements.y + spacing.spacing8

    const isEnoughSpaceUnder = fullHeight - top > MIN_HEIGHT
    const isEnoughSpaceOver = fullHeight - bottom > MIN_HEIGHT
    if (!isEnoughSpaceUnder && isEnoughSpaceOver) {
      return { bottom }
    }

    return { top }
  }, [toggleMeasurements.y, windowScrollY, fullHeight, toggleMeasurements.height])

  return (
    <TouchableWhenOpen
      animation="fast"
      maxHeight={maxHeight}
      minWidth={dropdownMinWidth ?? DEFAULT_MIN_WIDTH}
      position="absolute"
      testID="dropdown-content"
      {...position}
      {...containerProps}
      enterStyle={{ y: -20, opacity: 0 }}
      exitStyle={{ y: -10, opacity: 0 }}
    >
      <BaseCard.Shadow
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth="$spacing1"
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
            showsVerticalScrollIndicator={isWebPlatform}
            onScroll={scrollHandler}
          >
            <Flex
              gap={dropdownGap}
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
                  hoverable
                  borderRadius="$rounded8"
                  onPress={(event) => {
                    executeWithFrameDelay({
                      firstAction: () => {
                        if (closeOnSelect) {
                          handleClose?.(event)
                        }
                      },
                      secondAction: onPress,
                    })
                  }}
                >
                  <Flex testID={key}>{render()}</Flex>
                </TouchableArea>
              ))}
            </Flex>
          </Animated.ScrollView>

          {/* Custom scrollbar to ensure it is visible on iOS and Android even if not scrolling
        and to be able to customize its appearance */}
          {overflowsContainer && !isWebPlatform && (
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
  handleClose?: FlexProps['onPress']
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

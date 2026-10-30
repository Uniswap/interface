import { isAndroid, isTouchable, isWebApp, isWebPlatform } from '@universe/environment'
import {
  cn,
  Flex,
  type FlexCompatProps as FlexProps,
  spacing,
  TouchableArea,
  type TouchableAreaProps,
  zIndexes,
} from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { Portal } from '@universe/mycelium/portal'
import { Presence } from '@universe/mycelium/presence'
import { useDeviceDimensions, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import React, {
  type CSSProperties,
  forwardRef,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { LayoutChangeEvent, View } from 'react-native'
import { GestureResponderEvent } from 'react-native'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { OverKeyboardContent } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { Backdrop } from 'uniswap/src/components/dropdowns/ActionSheetDropdownBackdrop'
import {
  OVERLAY_ANIMATE_PRESENCE,
  CONTENT_PRESENCE_STYLE,
  dropdownExitProps,
  PRESENCE_CLASSES,
} from 'uniswap/src/components/dropdowns/actionSheetDropdownPresence'
import { measureDropdownAnchor } from 'uniswap/src/components/dropdowns/measureDropdownAnchor'
import { Scrollbar } from 'uniswap/src/components/misc/Scrollbar'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useOnMobileAppState } from 'utilities/src/device/appState'
import { closeKeyboardBeforeCallback } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { executeWithFrameDelay } from 'utilities/src/react/delayUtils'
import { useEvent } from 'utilities/src/react/hooks'
import { useTimeout } from 'utilities/src/time/timing'

const DEFAULT_MIN_WIDTH = 225
const MIN_HEIGHT = 250

const contentContainerStyle = {
  padding: spacing.spacing8,
}

const MenuOptionItem = ({
  onPress,
  closeOnSelect,
  handleClose,
  render,
  testID,
}: {
  onPress: () => void
  closeOnSelect: boolean
  handleClose: DropdownContentProps['handleClose']
  render: () => React.ReactNode
  testID: string
}): JSX.Element => {
  const handleOnPress: TouchableAreaProps['onPress'] = useEvent((event) => {
    executeWithFrameDelay({
      firstAction: () => {
        if (closeOnSelect) {
          handleClose?.(event)
        }
      },
      secondAction: onPress,
    })
  })
  return (
    <TouchableArea hoverable borderRadius="$rounded8" onPress={handleOnPress}>
      <Flex testID={testID}>{render()}</Flex>
    </TouchableArea>
  )
}

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
  const colors = useSporeColors()
  const containerRef = useRef<View>(null)
  const [isOpen, setOpen] = useState(false)
  const [toggleMeasurements, setToggleMeasurements] = useState<ToggleMeasurements | null>(null)

  const openDropdown = (event: GestureResponderEvent): void => {
    onPress?.(event)

    // Dismiss the keyboard before opening the dropdown to avoid touch handling issues
    closeKeyboardBeforeCallback(() => {
      const containerNode = containerRef.current

      if (containerNode) {
        measureDropdownAnchor(containerNode, ({ x, y, width, height }) => {
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
    })
  }

  useEffect(() => {
    if (!isWebPlatform) {
      return undefined
    }

    function resizeListener(): void {
      measureDropdownAnchor(containerRef.current, ({ x, y, width, height }) => {
        // Only reposition an open dropdown: a null `prev` would spread into a truthy object.
        setToggleMeasurements((prev) => (prev ? { ...prev, x, y, width, height } : prev))
      })
    }

    window.addEventListener('resize', resizeListener)

    return () => {
      window.removeEventListener('resize', resizeListener)
    }
  }, [toggleMeasurements?.sticky, insets.top])

  const closeDropdown = useCallback(
    (event: GestureResponderEvent): void => {
      setOpen(false)
      setToggleMeasurements(null)
      event.preventDefault()
      event.stopPropagation()
    },
    [setOpen, setToggleMeasurements],
  )

  const dismissOnBackground = useEvent(() => {
    setOpen(false)
    setToggleMeasurements(null)
  })

  useOnMobileAppState('background', dismissOnBackground)

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
          py={styles?.buttonPaddingY ?? '$spacing8'}
          // TODO(INFRA-1126) -- testIDs inside TouchableArea are not recognized by Maestro
          testID={testID || 'dropdown-toggle'}
        >
          {/* Toggle children must set their own colour: the compat TouchableArea clones its Spore
              guidance into direct children but skips mycelium primitives, so nothing cascades here. */}
          {children}
          {/* Pre-resolved, not `$neutral2`: the web icon lane maps a token it cannot resolve to
              `undefined` and silently falls back to `currentColor`. */}
          {showArrow && (
            <RotatableChevron color={colors.neutral2.val} direction={isOpen ? 'up' : 'down'} size="$icon.20" />
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
  // Narrowed deliberately: the spread below lands next to the two props `Presence` reads off the
  // element, so a wider type could silently override them and undo the native exit opt-out.
  contentProps: Pick<ActionSheetDropdownProps, 'options'>
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

  // OverKeyboardContent's web leg renders `{visible && children}`, so hold the wrapper open for as
  // long as `Presence` may still have children — through the exit, not just while open. Keyed on
  // the open lifecycle: the resize listener rewrites measurements while closed, which would
  // otherwise mount the overlay.
  const [presenceMounted, setPresenceMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPresenceMounted(true)
    }
  }, [isOpen])

  // Sole clearing path for the latch. Both children opt out of the exit phase on native, and
  // `Presence` still drains them: its instant-lane loop calls `finishExit` per entry, which fires
  // this once `exiting` empties (Presence.native.tsx:374 -> :256). If that loop ever stops draining
  // every opted-out entry, the wrapper would stay mounted over an empty `Presence`.
  const handleExitComplete = useEvent(() => setPresenceMounted(false))

  if (!shouldRender) {
    return null
  }

  const zIndex =
    typeof styles?.dropdownZIndex === 'number'
      ? styles.dropdownZIndex
      : typeof styles?.dropdownZIndex === 'boolean'
        ? Number(styles.dropdownZIndex)
        : zIndexes.popover

  return (
    <Portal stackZIndex={zIndex}>
      <OverKeyboardContent visible={isOpen || presenceMounted}>
        <Presence getExitProps={dropdownExitProps} onExitComplete={handleExitComplete}>
          {toggleMeasurements && (
            <Backdrop
              key="dropdown-backdrop"
              position="absolute"
              animatePresence={OVERLAY_ANIMATE_PRESENCE}
              handleClose={closeDropdown}
              opacity={!isWebApp || isTouchable ? styles?.backdropOpacity : 0}
            />
          )}
          {toggleMeasurements && (
            <DropdownContent
              key="dropdown-content"
              {...contentProps}
              position="absolute"
              animatePresence={OVERLAY_ANIMATE_PRESENCE}
              alignment={styles?.alignment}
              dropdownMaxHeight={styles?.dropdownMaxHeight}
              dropdownMinWidth={styles?.dropdownMinWidth}
              dropdownGap={styles?.dropdownGap}
              handleClose={closeDropdown}
              toggleMeasurements={toggleMeasurements}
              closeOnSelect={closeOnSelect}
            />
          )}
        </Presence>
      </OverKeyboardContent>
    </Portal>
  )
})

/** Not `FlexProps & …`: the sole caller passes only the named props, so the old spread onto
 * `BaseCard.Shadow` was always empty. */
type DropdownContentProps = {
  options: MenuItemProp[]
  alignment?: 'left' | 'right'
  dropdownMaxHeight?: number
  dropdownMinWidth?: number
  dropdownGap?: FlexProps['gap']
  toggleMeasurements: LayoutMeasurements & { sticky?: boolean }
  handleClose?: FlexProps['onPress']
  closeOnSelect: boolean
  className?: string
  style?: CSSProperties
  /**
   * Both read by `Presence` off `element.props`, never used here. `position` gets this
   * absolutely-positioned content an out-of-flow wrapper that fills the parent, so it resolves
   * against the same box it would with no wrapper. `animatePresence={false}` drops the exit hold on
   * native, where an exiting node stays interactive for the whole fade.
   */
  position?: 'absolute'
  animatePresence?: boolean
}

/** `Presence` sets `data-exiting` on the node it holds and merges exit `className`/`style` into
 * the clone, so the animated node must be this component's root. */
const DropdownContent = forwardRef<View, DropdownContentProps>(function DropdownContent(
  {
    options,
    alignment = 'left',
    dropdownMaxHeight,
    dropdownMinWidth,
    dropdownGap,
    toggleMeasurements,
    handleClose,
    closeOnSelect,
    className,
    style,
  },
  ref,
): JSX.Element {
  const insets = useAppInsets()
  const { fullWidth, fullHeight } = useDeviceDimensions()

  const scrollOffset = useSharedValue(0)
  const [contentHeight, setContentHeight] = useState(0)

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

  useEffect(() => {
    setWindowScrollY(0)
  }, [toggleMeasurements])

  const verticalOffset = useMemo((): { top?: number; bottom?: number } => {
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

  const handleOnLayout = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height)
  }, [])

  return (
    <Flex
      ref={ref}
      className={cn('pointer-events-auto', PRESENCE_CLASSES, className)}
      style={{ ...CONTENT_PRESENCE_STYLE, ...style }}
      maxHeight={maxHeight}
      minWidth={dropdownMinWidth ?? DEFAULT_MIN_WIDTH}
      position="absolute"
      testID="dropdown-content"
      {...verticalOffset}
      {...containerProps}
    >
      <BaseCard.Shadow
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth="$spacing1"
        overflow="hidden"
        p="$none"
      >
        <Flex row maxHeight={maxHeight}>
          <Animated.ScrollView
            contentContainerStyle={contentContainerStyle}
            scrollEnabled={overflowsContainer}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={isWebPlatform}
            onScroll={(event) => {
              scrollOffset.value = event.nativeEvent.contentOffset.y
            }}
          >
            <Flex gap={dropdownGap} onLayout={handleOnLayout}>
              {options.map(({ key, onPress, render }) => (
                <MenuOptionItem
                  key={key}
                  testID={key}
                  closeOnSelect={closeOnSelect}
                  handleClose={handleClose}
                  render={render}
                  onPress={onPress}
                />
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
    </Flex>
  )
})

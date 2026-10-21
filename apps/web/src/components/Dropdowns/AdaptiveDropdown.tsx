import { Flex, type FlexCompatProps, heights, WebBottomSheet, zIndexes } from '@universe/mycelium'
import { curveToAnimationTiming } from '@universe/mycelium/compat'
import { Presence } from '@universe/mycelium/presence'
import { useMedia, useScrollbarStyles, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import {
  type CSSProperties,
  forwardRef,
  type PropsWithChildren,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { getDropdownAvailableSpace, getDropdownVerticalLayout } from '~/components/Dropdowns/dropdownLayoutUtils'
import { useFixedDropdownLayout } from '~/components/Dropdowns/useFixedDropdownLayout'
import { Portal } from '~/components/Popups/Portal'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'

// Gap between the trigger element and the dropdown content
const DROPDOWN_OFFSET = 10

// The dropdown fades ±20px toward its resting place on enter and back out on exit — off the
// pinned 10px preset pool, so the offset rides the parameterized presence keyframes instead.
const DROPDOWN_SLIDE_PX = 20
const DROPDOWN_PRESENCE_CLASSES = 'animate-spore-enter-presence data-exiting:animate-spore-exit-presence opacity-[1]'

// Timing of the legacy fastHeavy animation preset.
const DROPDOWN_ANIMATION_TIMING: CSSProperties = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS.fastHeavy)

type DropdownContentProps = FlexCompatProps & {
  positionRight?: boolean
  positionTop?: boolean
}

// Rewrite of the legacy styled(Flex) factory on the compat Flex: base chrome as
// props (call-site spreads arrive later in `rest`, so they override the base),
// with the position variants expanded after the spreads to keep the legacy
// variant-over-style precedence. Deliberately opposite to TriggerButton, where
// the `active` variant sits before the spreads so caller overrides win.
const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(function DropdownContent(
  { positionRight, positionTop, ...rest },
  ref,
) {
  return (
    <Flex
      ref={ref}
      display="flex"
      flexDirection="column"
      minWidth={150}
      backgroundColor="$surface1"
      borderWidth={0.5}
      borderStyle="solid"
      borderColor="$surface3"
      borderRadius="$rounded12"
      p="$spacing8"
      zIndex={zIndexes.dropdown}
      overflow="auto"
      {...rest}
      {...(positionRight === undefined
        ? {}
        : positionRight
          ? { right: 0, left: 'unset' }
          : { right: 'unset', left: 0 })}
      {...(positionTop === undefined
        ? {}
        : positionTop
          ? { top: 'unset', bottom: `calc(100% + ${DROPDOWN_OFFSET}px)` }
          : { bottom: 'unset', top: `calc(100% + ${DROPDOWN_OFFSET}px)` })}
    />
  )
})

function DropdownContainer({ children }: PropsWithChildren): JSX.Element {
  return (
    <Flex
      display="inline-flex"
      justifyContent="center"
      alignItems="center"
      position="relative"
      borderWidth="$none"
      width="100%"
    >
      {children}
    </Flex>
  )
}

export interface SharedDropdownProps {
  isOpen: boolean
  /**
   * Must apply the argument, not flip. The sheet's `onClose` requests `false` directly, and two
   * dismissals in one tick (drag plus overlay press) would cancel each other out under a toggle.
   */
  toggleOpen: (open: boolean) => void
  dropdownTestId?: string
  adaptToSheet?: boolean
  tooltipText?: string
  dropdownStyle?: FlexCompatProps
  containerStyle?: CSSProperties
  alignRight?: boolean
  allowFlip?: boolean
  positionFixed?: boolean // render desktop dropdowns in a body portal so menus can escape clipped parents
  matchTriggerWidth?: boolean
  forceFlipUp?: boolean // force dropdown to render above trigger
  children: JSX.Element | JSX.Element[]
  ignoredNodes?: RefObject<HTMLElement | undefined | null>[] // nodes to ignore for click-outside handling
  ignoreDialogClicks?: boolean // ignore clicks on dialog/modal elements
}

type AdaptiveDropdownProps = SharedDropdownProps & {
  trigger?: JSX.Element // optional when dropdown is controlled externally
  adaptWhen?: 'sm' | 'md'
}

function getDropdownMaxHeightProps({
  availableMaxHeight,
  configuredMaxHeight,
}: {
  availableMaxHeight?: number
  configuredMaxHeight?: FlexCompatProps['maxHeight']
}): { maxHeight?: FlexCompatProps['maxHeight'] } {
  if (availableMaxHeight === undefined) {
    return {}
  }

  if (typeof configuredMaxHeight === 'number') {
    return { maxHeight: Math.min(configuredMaxHeight, availableMaxHeight) }
  }

  return configuredMaxHeight === undefined ? { maxHeight: availableMaxHeight } : {}
}

// Calls `reset` synchronously (React's "adjust state during rendering" pattern) the moment `value`
// transitions to true, so dependent state is cleared before this same render commits.
function useResetOnTrue(value: boolean, reset: () => void): void {
  const prevValueRef = useRef(value)
  if (prevValueRef.current !== value) {
    prevValueRef.current = value
    if (value) {
      reset()
    }
  }
}

export function AdaptiveDropdown({
  isOpen,
  toggleOpen,
  trigger,
  dropdownTestId,
  tooltipText,
  adaptToSheet,
  dropdownStyle,
  containerStyle,
  alignRight,
  allowFlip,
  positionFixed,
  matchTriggerWidth,
  forceFlipUp,
  children,
  ignoredNodes,
  ignoreDialogClicks,
  adaptWhen = 'sm',
}: AdaptiveDropdownProps) {
  const node = useRef<HTMLDivElement | null>(null)
  const dropdownNode = useRef<HTMLDivElement | null>(null)
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const media = useMedia()
  const isSheet = !!adaptToSheet && media[adaptWhen]
  const shouldUseFixedLayout = !!positionFixed
  // The sticky app header overlaps content once scrolled, so it isn't usable space for flipping a dropdown upward.
  const headerHeight = useAppHeaderHeight()
  const fixedDropdown = useFixedDropdownLayout({
    alignRight,
    allowFlip,
    dropdownOffset: DROPDOWN_OFFSET,
    enabled: shouldUseFixedLayout,
    forceFlipUp,
    isOpen,
    isSheet,
    matchTriggerWidth,
    measuringDropdownRef: dropdownNode,
    triggerRef: node,
    topInset: headerHeight,
  })
  const handleClickOutside = useEvent(() => {
    if (isOpen) {
      toggleOpen(false)
    }
  })
  const ignoredNodesWithDropdown = useMemo(
    () => (shouldUseFixedLayout ? [...(ignoredNodes ?? []), fixedDropdown.dropdownRef] : ignoredNodes),
    [fixedDropdown.dropdownRef, ignoredNodes, shouldUseFixedLayout],
  )
  useOnClickOutside({
    node,
    handler: isSheet ? undefined : handleClickOutside,
    ignoredNodes: ignoredNodesWithDropdown,
    ignoreDialogClicks,
  })
  const [inlineFlipVertical, setInlineFlipVertical] = useState(false)
  const [inlineDropdownMaxHeight, setInlineDropdownMaxHeight] = useState<number | undefined>(undefined)
  const [inlineLayoutReady, setInlineLayoutReady] = useState(false)
  // Reset readiness the moment isOpen flips true, before the live dropdown below mounts. It's
  // position: absolute and would otherwise inflate document.documentElement.scrollHeight with its own
  // unclamped height before we ever measure it, making it look like there's always room below and it
  // never flips.
  useResetOnTrue(isOpen, () => setInlineLayoutReady(false))

  // Normal dropdowns stay positioned relative to their trigger. Fixed dropdowns skip this path and let
  // useFixedDropdownLayout measure the trigger for portal coordinates.
  useLayoutEffect(() => {
    if (!isOpen || isSheet || shouldUseFixedLayout || !node.current) {
      return
    }

    const rect = node.current.getBoundingClientRect()
    const { spaceAbove, spaceBelow } = getDropdownAvailableSpace({
      dropdownOffset: DROPDOWN_OFFSET,
      triggerRect: rect,
      topInset: headerHeight,
      documentHeight: document.documentElement.scrollHeight,
      scrollY: window.scrollY,
    })
    const dropdownHeight = dropdownNode.current?.offsetHeight ?? 0
    const { dropdownMaxHeight, flipVertical } = getDropdownVerticalLayout({
      allowFlip,
      dropdownHeight,
      forceFlipUp,
      spaceAbove,
      spaceBelow,
    })

    setInlineFlipVertical(flipVertical)
    setInlineDropdownMaxHeight(dropdownMaxHeight)
    setInlineLayoutReady(true)
  }, [allowFlip, dropdownNode, forceFlipUp, headerHeight, isOpen, isSheet, node, shouldUseFixedLayout])

  const flipVertical = shouldUseFixedLayout ? fixedDropdown.flipVertical : inlineFlipVertical
  const dropdownMaxHeight = shouldUseFixedLayout ? fixedDropdown.dropdownMaxHeight : inlineDropdownMaxHeight
  // Preserve existing inline dropdown behavior: explicit maxHeight wins. Fixed portal menus also clamp numeric maxHeight
  // to the viewport so the escaped menu does not render off-screen.
  const maxHeightProps = getDropdownMaxHeightProps({
    availableMaxHeight: dropdownMaxHeight,
    configuredMaxHeight: dropdownStyle?.maxHeight,
  })
  const usesNestedScroll = dropdownStyle?.overflow === 'hidden'

  // Legacy enterStyle/exitStyle: from/to {opacity: 0, y: 20} when flipped above the trigger,
  // {opacity: 0, y: -20} when below.
  const slideOffset = flipVertical ? `${DROPDOWN_SLIDE_PX}px` : `${-DROPDOWN_SLIDE_PX}px`
  const presenceStyle = {
    ...DROPDOWN_ANIMATION_TIMING,
    '--spore-presence-enter-y': slideOffset,
    '--spore-presence-exit-y': slideOffset,
  } as CSSProperties

  const dropdownContent = (
    <DropdownContent
      ref={shouldUseFixedLayout ? fixedDropdown.dropdownRef : undefined}
      data-testid={dropdownTestId}
      className={DROPDOWN_PRESENCE_CLASSES}
      {...dropdownStyle}
      {...shadowProps}
      {...maxHeightProps}
      {...(usesNestedScroll && maxHeightProps.maxHeight !== undefined
        ? { flexDirection: 'column', minHeight: 0, overflow: 'hidden' }
        : {})}
      {...(!shouldUseFixedLayout && matchTriggerWidth ? { width: '100%' } : {})}
      style={
        shouldUseFixedLayout
          ? { ...scrollbarStyles, ...fixedDropdown.fixedStyle, ...presenceStyle }
          : { ...scrollbarStyles, ...presenceStyle }
      }
      positionRight={!shouldUseFixedLayout && alignRight}
      positionTop={flipVertical}
      position={shouldUseFixedLayout ? undefined : trigger ? 'absolute' : 'relative'}
      {...(shouldUseFixedLayout ? { zIndex: fixedDropdown.zIndex } : {})}
    >
      {children}
    </DropdownContent>
  )

  return (
    <>
      {!isSheet && (
        // The legacy VisuallyHidden footprint (@tamagui/visually-hidden): laid out but invisible
        <Flex
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            margin: -1,
            zIndex: -10000,
            overflow: 'hidden',
            opacity: 1e-8,
            pointerEvents: 'none',
          }}
        >
          {/* This hidden copy is only for measuring dropdown dimensions - data-testid-ignore lets tests filter it out */}
          <Flex data-testid-ignore>
            {/* hidden node cannot be position absolute or else height will register as 0 */}
            <DropdownContent
              ref={dropdownNode}
              {...dropdownStyle}
              {...shadowProps}
              style={scrollbarStyles}
              positionRight={alignRight}
              positionTop={false}
            >
              {children}
            </DropdownContent>
          </Flex>
        </Flex>
      )}
      {/* oxlint-disable-next-line react/forbid-elements -- needed here */}
      <div ref={node} style={{ width: '100%', ...containerStyle }}>
        <DropdownContainer>
          {trigger && (
            <MouseoverTooltip
              disabled={!tooltipText || isOpen}
              text={tooltipText}
              size={TooltipSize.Max}
              placement="top"
              style={{ width: '100%' }}
            >
              {trigger}
            </MouseoverTooltip>
          )}
          <Presence>{isOpen && !isSheet && !shouldUseFixedLayout && inlineLayoutReady && dropdownContent}</Presence>
        </DropdownContainer>
      </div>
      {fixedDropdown.shouldRenderPortal && (
        <Portal>
          <Presence onExitComplete={fixedDropdown.onExitComplete}>
            {isOpen && fixedDropdown.fixedStyle && dropdownContent}
          </Presence>
        </Portal>
      )}
      {isSheet && (
        <WebBottomSheet
          isOpen={isOpen}
          onClose={() => toggleOpen(false)}
          maxHeight={`calc(100dvh - ${heights['interface-nav']}px)`}
          testID={dropdownTestId}
        >
          {children}
        </WebBottomSheet>
      )}
    </>
  )
}

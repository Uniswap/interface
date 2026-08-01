import { type CSSProperties, type RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  styled,
  useMedia,
  useScrollbarStyles,
  useShadowPropsMedium,
  VisuallyHidden,
  WebBottomSheet,
} from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { getDropdownAvailableSpace, getDropdownVerticalLayout } from '~/components/Dropdowns/dropdownLayoutUtils'
import { useFixedDropdownLayout } from '~/components/Dropdowns/useFixedDropdownLayout'
import { Portal } from '~/components/Popups/Portal'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'

// Gap between the trigger element and the dropdown content
const DROPDOWN_OFFSET = 10

const DropdownContent = styled(Flex, {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 150,
  backgroundColor: '$surface1',
  borderWidth: 0.5,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  p: '$spacing8',
  zIndex: zIndexes.dropdown,
  animation: 'fastHeavy',
  '$platform-web': { overflow: 'auto' },
  variants: {
    positionRight: {
      true: {
        right: 0,
        left: 'unset',
      },
      false: {
        right: 'unset',
        left: 0,
      },
    },
    positionTop: {
      true: {
        top: 'unset',
        bottom: `calc(100% + ${DROPDOWN_OFFSET}px)`,
        enterStyle: { opacity: 0, y: 20 },
        exitStyle: { opacity: 0, y: 20 },
      },
      false: {
        bottom: 'unset',
        top: `calc(100% + ${DROPDOWN_OFFSET}px)`,
        enterStyle: { opacity: 0, y: -20 },
        exitStyle: { opacity: 0, y: -20 },
      },
    },
  },
})

const DropdownContainer = styled(Flex, {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  borderWidth: '$none',
  width: '100%',
})

export interface SharedDropdownProps {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  dropdownTestId?: string
  adaptToSheet?: boolean
  tooltipText?: string
  dropdownStyle?: FlexProps
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
  configuredMaxHeight?: FlexProps['maxHeight']
}): { maxHeight?: FlexProps['maxHeight'] } {
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

  const dropdownContent = (
    <DropdownContent
      ref={shouldUseFixedLayout ? fixedDropdown.dropdownRef : undefined}
      data-testid={dropdownTestId}
      animation="fastHeavy"
      {...dropdownStyle}
      {...shadowProps}
      {...maxHeightProps}
      {...(usesNestedScroll && maxHeightProps.maxHeight !== undefined
        ? { flexDirection: 'column', minHeight: 0, overflow: 'hidden' }
        : {})}
      {...(!shouldUseFixedLayout && matchTriggerWidth ? { width: '100%' } : {})}
      style={shouldUseFixedLayout ? { ...scrollbarStyles, ...fixedDropdown.fixedStyle } : scrollbarStyles}
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
        <VisuallyHidden>
          {/* This hidden copy is only for measuring dropdown dimensions - data-testid-ignore lets tests filter it out */}
          <Flex data-testid-ignore>
            {/* hidden node cannot be position absolute or else height will register as 0 */}
            <DropdownContent
              ref={dropdownNode}
              animation="fastHeavy"
              {...dropdownStyle}
              {...shadowProps}
              style={scrollbarStyles}
              positionRight={alignRight}
              positionTop={false}
            >
              {children}
            </DropdownContent>
          </Flex>
        </VisuallyHidden>
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
          <AnimatePresence>
            {isOpen && !isSheet && !shouldUseFixedLayout && inlineLayoutReady && dropdownContent}
          </AnimatePresence>
        </DropdownContainer>
      </div>
      {fixedDropdown.shouldRenderPortal && (
        <Portal>
          <AnimatePresence onExitComplete={fixedDropdown.onExitComplete}>
            {isOpen && fixedDropdown.fixedStyle && dropdownContent}
          </AnimatePresence>
        </Portal>
      )}
      {isSheet && (
        <WebBottomSheet
          isOpen={isOpen}
          onClose={() => toggleOpen(false)}
          maxHeight={`calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`}
          testID={dropdownTestId}
        >
          {children}
        </WebBottomSheet>
      )}
    </>
  )
}

import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import type * as React from 'react'
import { cloneElement, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { assert } from 'utilities/src/errors'
import { useEvent } from 'utilities/src/react/hooks'
import { cn } from '../cn'
import { ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from '../compat/animations'
import { RESET_CLASSES } from '../compat/style-classes'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { Presence } from '../presence'
import {
  containerClasses,
  getOptionTextColorClass,
  LABEL_CLASSES_LARGE,
  LABEL_CLASSES_SMALL,
  optionClasses,
} from './style-classes'
import type { SegmentedControlProps } from './types'

/**
 * The legacy root frame allocates an invisible 1px border that is part of the
 * control's layout footprint (see ROOT_FRAME_STYLE in style-classes.ts);
 * everything else about the root is mycelium Flex's own defaults.
 */
const ROOT_CLASSES = 'border border-transparent'

/** Web additions to the shared container table: explicit `flex`, the view resets, `outlineWidth: 0` (legacy). */
const CONTAINER_WEB_CLASSES = `flex ${RESET_CLASSES} shrink-0 outline-0`

/**
 * Web additions to the shared option table: explicit `flex`, the view resets,
 * no border (an option is a bare <button>, which Chrome paints with a 2px
 * outset border), no underline (options can render as anchors), and the legacy
 * transparent outline color — the UA focus ring paints invisibly, as in the
 * legacy render.
 */
const OPTION_WEB_CLASSES = `flex ${RESET_CLASSES} shrink-0 border-0 no-underline outline-transparent`

/**
 * The roving indicator pill: absolute overlay above the option row (legacy
 * zIndex `$mask` = 10). Because it covers the selected option, it tracks its
 * own hover for the `$surface3Hovered` fill, and a click on it lands nowhere —
 * both exactly like the legacy overlay. Enter/exit ride the Spore presets via
 * `Presence`; position/size ride INDICATOR_TRANSITION below.
 */
const INDICATOR_BASE_CLASSES = 'absolute left-0 top-0 z-10 rounded-full cursor-pointer'

/**
 * The legacy `fast` curve on transform/width/height only. Color is
 * deliberately NOT transitioned (repo rule: scope transitions to non-color
 * properties — it flashes on light/dark toggle), so the hover fill switches
 * per-frame, like the native leg.
 */
const INDICATOR_TRANSITION = ['transform', 'width', 'height']
  .map((property) => `${property} ${SPORE_ANIMATION_CURVE_CSS.fast}`)
  .join(', ')

/** Rect of the selected option relative to the container's padding box (the pill's containing block). */
interface IndicatorRect {
  left: number
  top: number
  width: number
  height: number
}

function sameRect(a: IndicatorRect | null, b: IndicatorRect | null): boolean {
  if (a === null || b === null) {
    return a === b
  }
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
}

// offset* values ignore ancestor transforms (e.g. a popover's scale-in); getBoundingClientRect doesn't.
function measureOptionRect(container: HTMLElement, node: HTMLElement): IndicatorRect | null {
  let left = node.offsetLeft
  let top = node.offsetTop
  let parent = node.offsetParent
  while (parent instanceof HTMLElement && parent !== container) {
    left += parent.offsetLeft + parent.clientLeft
    top += parent.offsetTop + parent.clientTop
    parent = parent.offsetParent
  }
  if (parent !== container) {
    return null
  }
  return { left, top, width: node.offsetWidth, height: node.offsetHeight }
}

/**
 * Spore segmented control, for selecting between multiple options — the
 * INFRA-3518 web leg, a pixel-parity port of the legacy Tamagui component
 * (packages/ui/src/components/SegmentedControl/SegmentedControl.tsx) onto DOM
 * elements + Tailwind classes.
 *
 * @param options - An array of options to display in the segmented control - must have between 2 and 6 options.
 * @param selectedOption - The value of the currently selected option.
 * @param onSelectOption - Callback function to be called when an option is selected.
 * @param size - The size of the segmented control which affects the height and padding.
 * @param disabled - Whether the segmented control is disabled.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedOption,
  onSelectOption,
  onHoverOption,
  size = 'default',
  disabled,
  fullWidth,
  variableOptionWidths,
  outlined = true,
  gap,
}: SegmentedControlProps<T>): React.JSX.Element {
  assert(options.length >= 2 && options.length <= 6, 'Segmented control must have between 2 and 6 options, inclusive.')

  const containerRef = useRef<HTMLDivElement | null>(null)
  // Live DOM nodes per option value: the indicator's measurement source and
  // the focus targets for the roving arrow-key navigation.
  const optionNodesRef = useRef(new Map<T, HTMLElement>())

  // Keyed by option value, not index, so the highlight stays with its option
  // when `options` changes under a stationary pointer.
  const [hoveredValue, setHoveredValue] = useState<T | undefined>(undefined)
  const [indicatorHovered, setIndicatorHovered] = useState(false)
  const [indicatorRect, setIndicatorRect] = useState<IndicatorRect | null>(null)

  const isLargeSize = size === 'large'

  const measureIndicator = useEvent((): void => {
    const container = containerRef.current
    const node = optionNodesRef.current.get(selectedOption)
    const next = container && node ? measureOptionRect(container, node) : null
    setIndicatorRect((prev) => (sameRect(prev, next) ? prev : next))
  })

  // Re-measure whenever anything that moves the options changes, and drop the
  // hover highlight if the hovered option was removed.
  useLayoutEffect(() => {
    measureIndicator()
    setHoveredValue((prev) =>
      prev !== undefined && !options.some((option) => option.value === prev) ? undefined : prev,
    )
  }, [measureIndicator, options, selectedOption, size, fullWidth, variableOptionWidths, outlined, gap])

  // The pill's own onMouseLeave never fires when the pill leaves the tree
  // under a stationary pointer, so a surviving flag would paint a later
  // remount with the hovered fill and no pointer over it. The native leg
  // resets the same flag when its exit settles.
  useLayoutEffect(() => {
    if (indicatorRect === null) {
      setIndicatorHovered(false)
    }
  }, [indicatorRect])

  // The pill is positioned from measured pixel rects (option widths are
  // content-based, so CSS alone can't place it — see the fullWidth note
  // below), and sizes can change without a re-render: font loads, label
  // reflows, fullWidth containers tracking the viewport. The observer is the
  // web counterpart of the onLayout events legacy Tamagui Tabs measured with.
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }
    // Deferred a frame (house rule, see HeightAnimator.web.tsx): layout reads
    // + a state write inside the observer's notification window risk the
    // "loop completed with undelivered notifications" error.
    let frameId: number | null = null
    const observer = new ResizeObserver(() => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
      frameId = requestAnimationFrame(() => {
        frameId = null
        measureIndicator()
      })
    })
    const container = containerRef.current
    if (container) {
      observer.observe(container)
    }
    const selectedNode = optionNodesRef.current.get(selectedOption)
    if (selectedNode) {
      observer.observe(selectedNode)
    }
    return () => {
      observer.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
    }
  }, [measureIndicator, selectedOption, options])

  const selectOption = ({ value, optionDisabled }: { value: T; optionDisabled: boolean }): void => {
    if (optionDisabled) {
      return
    }
    onSelectOption(value)
  }

  /**
   * The legacy arrow-key navigation (Tamagui Tabs' RovingFocusGroup:
   * horizontal, no loop): arrows move focus to the adjacent enabled option,
   * Home/End and PageUp/PageDown to the first/last, without selecting.
   * Space/Enter select through the same guarded path as a click.
   */
  const handleOptionKeyDown = ({
    event,
    value,
    optionDisabled,
  }: {
    event: KeyboardEvent<HTMLElement>
    value: T
    optionDisabled: boolean
  }): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      // preventDefault also suppresses the browser's synthetic click on
      // <button>, so an activation fires onSelectOption exactly once.
      event.preventDefault()
      selectOption({ value, optionDisabled })
      return
    }

    const intent = (
      {
        ArrowLeft: 'prev',
        ArrowRight: 'next',
        Home: 'first',
        PageUp: 'first',
        End: 'last',
        PageDown: 'last',
      } as const
    )[event.key]
    if (intent === undefined) {
      return
    }
    event.preventDefault()
    const enabledValues = options.filter((option) => !(disabled || option.disabled)).map((option) => option.value)
    const currentIndex = enabledValues.indexOf(value)
    const targetIndex =
      intent === 'first'
        ? 0
        : intent === 'last'
          ? enabledValues.length - 1
          : intent === 'next'
            ? Math.min(currentIndex + 1, enabledValues.length - 1)
            : Math.max(currentIndex - 1, 0)
    const targetValue = enabledValues[targetIndex]
    if (targetValue !== undefined && targetValue !== value) {
      optionNodesRef.current.get(targetValue)?.focus()
    }
  }

  const indicatorStyle: CSSProperties | undefined =
    indicatorRect === null
      ? undefined
      : {
          width: indicatorRect.width,
          height: indicatorRect.height,
          transform: `translate(${indicatorRect.left}px, ${indicatorRect.top}px)`,
          transition: INDICATOR_TRANSITION,
        }

  return (
    <FlexCompat className={ROOT_CLASSES}>
      {/* Legacy Tabs.List: tablist semantics (the options themselves override
          role="tab" with button/link, exactly like the legacy render). */}
      {/* oxlint-disable-next-line react/forbid-elements -- must carry aria-orientation, which mycelium Flex's compat surface (mirroring RN's aria props) does not */}
      <div
        ref={containerRef}
        aria-orientation="horizontal"
        className={cn(CONTAINER_WEB_CLASSES, containerClasses({ size, outlined, fullWidth, gap }))}
        role="tablist"
      >
        {options.map((option) => {
          const { value, display, displayText, wrapper, href } = option

          const itemDisabled = Boolean(disabled || option.disabled)
          const isSelected = selectedOption === value
          const Tag = href ? 'a' : 'button'

          const sharedProps = {
            'aria-disabled': itemDisabled || undefined,
            'aria-selected': isSelected,
            className: cn(
              OPTION_WEB_CLASSES,
              optionClasses({ size }),
              // Legacy web fullWidth is NOT an equal split: react-native-web
              // resolves the legacy `flex: 1` to flex-basis auto, so each
              // option gets its content width plus an equal share of the free
              // space. `variableOptionWidths` sets the same longhands on web;
              // only the native leg keeps Yoga's basis-0 equal split.
              fullWidth && 'grow shrink basis-auto',
              itemDisabled ? '[cursor:unset]' : 'cursor-pointer',
            ),
            ref: (node: HTMLElement | null): void => {
              if (node) {
                optionNodesRef.current.set(value, node)
              } else {
                optionNodesRef.current.delete(value)
              }
            },
            role: !itemDisabled && href ? 'link' : 'button',
            // Disabled options leave the tab sequence and the arrow-key path (legacy).
            tabIndex: itemDisabled ? -1 : 0,
            onClick: (event: React.MouseEvent<HTMLElement>): void => {
              if (href) {
                event.preventDefault()
              }
              selectOption({ value, optionDisabled: itemDisabled })
            },
            onKeyDown: (event: KeyboardEvent<HTMLElement>): void =>
              handleOptionKeyDown({ event, value, optionDisabled: itemDisabled }),
            // Disabled <button>s never fire mouse events; the guard makes
            // disabled anchor options behave identically.
            onMouseEnter: (): void => {
              if (itemDisabled) {
                return
              }
              setHoveredValue(value)
              onHoverOption?.(value)
            },
            onMouseLeave: (): void => setHoveredValue(undefined),
          }

          const label = display ?? (
            <span
              className={cn(
                isLargeSize ? LABEL_CLASSES_LARGE : LABEL_CLASSES_SMALL,
                getOptionTextColorClass({
                  active: isSelected,
                  hovered: hoveredValue === value,
                  disabled: itemDisabled,
                }),
              )}
            >
              {displayText ?? value}
            </span>
          )

          const optionElement =
            Tag === 'a' ? (
              <a key={value} href={itemDisabled ? undefined : href} {...sharedProps}>
                {label}
              </a>
            ) : (
              <button key={value} disabled={itemDisabled} type="button" {...sharedProps}>
                {label}
              </button>
            )

          if (wrapper) {
            // To avoid perf issues, we expect the callsite to pass an instance of a component,
            // not a functional component. As a result we can't render it with typical JSX and need
            // to clone it here. (Carried over from the legacy component.) The clone gets the
            // option's key so React reconciles wrapped entries by value, not position.
            return cloneElement(wrapper, {
              key: value,
              children: optionElement,
            })
          }
          return optionElement
        })}
        <Presence>
          {indicatorRect !== null && (
            <FlexCompat
              key="indicator"
              aria-hidden
              className={cn(
                INDICATOR_BASE_CLASSES,
                indicatorHovered ? 'bg-surface3-hovered' : 'bg-surface3',
                ENTER_PRESET_CLASSES.fadeIn,
                EXIT_PRESET_CLASSES.fadeOut,
              )}
              style={indicatorStyle}
              testID="segmented-control-indicator"
              onMouseEnter={() => setIndicatorHovered(true)}
              onMouseLeave={() => setIndicatorHovered(false)}
            />
          )}
        </Presence>
      </div>
    </FlexCompat>
  )
}

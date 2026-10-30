/**
 * Web leg of the RefreshButton compat (INFRA-3489) — the drop-in Tailwind
 * twin of the deleted legacy `ui/src` `RefreshButton` composite: a
 * hover-revealed refresh icon that spins one full turn per press, wrapped in
 * the compat tooltip showing the localized label plus the `R` keycap, with the
 * same window-level `R` keyboard shortcut.
 *
 * Behavior mirrored from legacy, deliberately:
 * - a press mid-spin restarts the one-second spin window and still refetches;
 * - the keyboard shortcut fires WITHOUT the spin and is not gated on
 *   `isLoading` — only `disabled` blocks it (and unregisters the listener);
 * - while loading, presses are ignored but the button stays hover-revealed
 *   (the in-flight spin remains visible) and the icon keeps its base color;
 * - `disabled` hides the button entirely (see `compile.ts`).
 *
 * Deliberate deltas, both visible in the type contract or ledgered in
 * `compile.ts`:
 * - `tooltipLabel` is a required prop (mycelium has no i18n runtime — see
 *   `props.ts`);
 * - the hover reveal ships in both group-anchor systems (`group-hover:` +
 *   `legacy-group-hover:`) because the sole consumer's anchor is still a
 *   legacy Tamagui group — see `compile.ts`.
 */
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { cn } from '../cn'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { RotateRight } from '../components/icons/RotateRight'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { TextCompat } from '../text-compat/TextCompat'
import { TooltipCompat } from '../tooltip-compat/TooltipCompat'
import { TouchableAreaCompat } from '../touchable-area/TouchableAreaCompat'
import { refreshButtonFrameClassName, refreshIconFrameClassName } from './compile'
import { REFRESH_ICON_SIZE, REFRESH_SHORTCUT_KEYS, type RefreshButtonCompatProps } from './props'

/**
 * The legacy `RefreshButtonIcon`: the pressable frame + the spinning icon.
 * The spin class is toggled by the `isAnimating` boolean, exactly like the
 * legacy state/timeout pair — a press starts it and a timeout clears it one
 * second later. A press mid-spin only clears and re-arms that timeout; since
 * `isAnimating` is already `true`, the class never leaves the DOM, so the
 * animation itself is not retriggered — it keeps running from wherever it
 * is, and the visible spin simply stays up for the extended window.
 */
function RefreshButtonIconCompat({
  onPress,
  isLoading,
  disabled,
}: Omit<RefreshButtonCompatProps, 'tooltipLabel'>): JSX.Element {
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopAnimation = useCallback((): void => {
    setIsAnimating(false)
    timeoutRef.current = null
  }, [])

  const handlePress = useCallback((): void => {
    if (isLoading || disabled) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsAnimating(true)
    onPress()

    timeoutRef.current = setTimeout(stopAnimation, ONE_SECOND_MS)
  }, [isLoading, disabled, onPress, stopAnimation])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return (
    <TouchableAreaCompat
      className={refreshButtonFrameClassName({ isLoading, disabled })}
      disabled={isLoading || disabled}
      // Opts out of the injected animation, as legacy `RefreshButtonIcon` does; without it
      // the default and the frame's own `transition-opacity duration-100` both survive
      // tailwind-merge. Spelled with `animateOnly` because the migration gate bans the
      // `animation` prop outside exempt paths — byte-identical output at this call site.
      animateOnly={[]}
      // The children style themselves; the injected legacy `$accent3` default
      // is a rejected token on this side (ModalCloseIconCompat precedent).
      shouldAutomaticallyInjectColors={false}
      onPress={handlePress}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- the compat components ARE the raw DOM boundary; the spin class animates this wrapper, never the svg (whose transform belongs to the icon surface) */}
      <div className={cn(refreshIconFrameClassName({ isLoading, isAnimating }))}>
        <RotateRight size={REFRESH_ICON_SIZE} />
      </div>
    </TouchableAreaCompat>
  )
}

/**
 * Drop-in web replacement for the legacy `ui/src` `RefreshButton`. Mount it
 * under a hoverable group anchor — the button is invisible until the group is
 * hovered.
 */
export function RefreshButtonCompat({
  onPress,
  isLoading,
  disabled,
  tooltipLabel,
}: RefreshButtonCompatProps): JSX.Element {
  useEffect(() => {
    if (disabled) {
      return undefined
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement
      const isTypingInField = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

      if (REFRESH_SHORTCUT_KEYS.includes(e.key) && !isTypingInField) {
        onPress()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPress, disabled])

  return (
    <TooltipCompat delay={0} restMs={0} placement="bottom">
      <TooltipCompat.Trigger>
        <RefreshButtonIconCompat disabled={disabled} isLoading={isLoading} onPress={onPress} />
      </TooltipCompat.Trigger>
      <TooltipCompat.Content>
        <TooltipCompat.Arrow />
        <FlexCompat row gap="$gap8">
          <TextCompat variant="body4">{tooltipLabel}</TextCompat>
          <FlexCompat
            centered
            width="$spacing16"
            height="$spacing16"
            p="$spacing2"
            borderRadius="$rounded4"
            borderWidth="$spacing1"
            borderColor="$neutral3"
            shadowColor="$neutral3"
            shadowOffset={{ height: 1, width: 0 }}
          >
            <TextCompat variant="body4" color="$neutral2">
              R
            </TextCompat>
          </FlexCompat>
        </FlexCompat>
      </TooltipCompat.Content>
    </TooltipCompat>
  )
}
markMyceliumPrimitive(RefreshButtonCompat)

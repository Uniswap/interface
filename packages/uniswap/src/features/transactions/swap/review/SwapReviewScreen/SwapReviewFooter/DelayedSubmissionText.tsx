import { isWebPlatform } from '@universe/environment'
import { AnimatedFlex } from '@universe/mycelium'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS

// Reanimated leg (native) of the legacy Tamagui 'quicker' fadeInDownOutDown preset (enter from
// y -10/opacity 0, exit to y 10/opacity 0 -- packages/ui/src/animations/presets.ts). On web,
// FlexCompat's own `animateEnterExit` CSS classes (kept below) drive the same look:
// `entering`/`exiting` are ignored on web, `animateEnterExit` is a no-op on native
// (FlexCompat.native.tsx never reads it), so the two props cover one platform each without
// conflicting.
const fadeInDown: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 0, transform: [{ translateY: -10 }] },
    animations: {
      opacity: withSporeCurve('quicker', 1),
      transform: [{ translateY: withSporeCurve('quicker', 0) }],
    },
  }
}
const fadeOutDown: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withSporeCurve('quicker', 0),
      transform: [{ translateY: withSporeCurve('quicker', 10) }],
    },
  }
}

/**
 * For swaps that take longer to confirm, this component shows an animated
 * text that prompts the user to keep their wallet open.
 */
export function DelayedSubmissionText({
  TextComponent,
}: {
  /** Must be the enclosing button's own `Button.Text`: the two Button families use separate variant contexts. */
  TextComponent: ComponentType<{ children?: ReactNode }>
}): JSX.Element {
  const { t } = useTranslation()
  const [showKeepOpenMessage, setShowKeepOpenMessage] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowKeepOpenMessage(true), KEEP_OPEN_MSG_DELAY)
    return () => clearTimeout(timeout)
  }, [])

  // Use different key to re-trigger animation when message changes. The key change forces a real
  // unmount/mount, so entering/exiting (native) and the animateEnterExit CSS class (web) both fire
  // fresh, the same way the legacy AnimatePresence key remount did.
  const key = showKeepOpenMessage ? 'submitting-text-msg1' : 'submitting-text-msg2'

  return (
    <AnimatedFlex
      key={key}
      entering={fadeInDown}
      exiting={fadeOutDown}
      // Gated to web only: mycelium's native compat layer drops `animation`/`animateEnterExit` with a
      // dev-only warning (they're Tamagui-only concepts), so passing them unconditionally would spam
      // that warning on every native mount. animateOnly scopes the CSS transition to opacity/transform
      // (no color props here, but this keeps the theme-toggle color-flash rule satisfied by default).
      {...(isWebPlatform && {
        animateEnterExit: 'fadeInDownOutDown' as const,
        animation: 'quicker' as const,
        animateOnly: ['opacity', 'transform'],
      })}
    >
      <TextComponent>
        {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
      </TextComponent>
    </AnimatedFlex>
  )
}

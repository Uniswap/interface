import * as React from 'react'
import { cn } from '../cn'
import { createCompatComponent } from '../compat/dom'
import { RESET_CLASSES } from '../compat/style-classes'
import { textCompatClassName } from './compile'
import type { TextCompatProps } from './props'

/**
 * Web-only, drop-in replacement for the `ui/src` Tamagui `Text`, rendering
 * the same CSS via Tailwind classes (see `./compile`) through the shared
 * compat DOM wrapper (`../compat/dom`). The workbench harness
 * (`labs/workbench/scripts/verify-text-parity.mts`) proves the equivalence
 * per variant, color, typography prop, state, media pool, and loading state.
 *
 * Exported from the root barrel as the canonical `Text` (INFRA-3040); the cva
 * Text in `components/text.tsx` is deprecated.
 */

const VARIANT_TAG: Partial<Record<string, keyof React.JSX.IntrinsicElements>> = {
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
}

const TextCompatFrame = createCompatComponent<TextCompatProps>(textCompatClassName, 'TextCompatFrame')

/**
 * What the legacy Tamagui `Flex` contributes on web (react-native-web view
 * defaults) — the loading placeholder recreates the legacy DOM structure with
 * these, verified by the parity harness.
 */
const VIEW_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * The shimmer overlay (legacy `TextPlaceholder`): a rounded surface3 bar over
 * a screen-reader-hidden copy of the text.
 */
function TextCompatPlaceholder({ children }: React.PropsWithChildren<unknown>): React.JSX.Element {
  /* oxlint-disable react/forbid-elements -- recreates the legacy TextPlaceholder DOM (RNW Flex views) verbatim; mycelium has no Flex-with-view-defaults primitive */
  return (
    <div className={`${VIEW_CLASSES} flex-row items-center`} data-testid="text-placeholder">
      <div className={`${VIEW_CLASSES} flex-row items-center`}>
        <div className={VIEW_CLASSES}>{children}</div>
        <div
          className={cn(
            VIEW_CLASSES,
            'absolute top-[5%] right-[0px] bottom-[5%] left-[0px] rounded-[999999px] [background-color:var(--stext-surface3)]',
          )}
        />
      </div>
    </div>
  )
  /* oxlint-enable react/forbid-elements */
}

/** The legacy `Shine` shimmer: a masked wrapper animating its mask position. */
function ShineWrapper({ children }: React.PropsWithChildren<unknown>): React.JSX.Element {
  return (
    // oxlint-disable-next-line react/forbid-elements -- recreates the legacy Shine wrapper (an RNW Flex view) verbatim
    <div
      className={VIEW_CLASSES}
      style={{
        WebkitMaskImage: 'linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)',
        WebkitMaskSize: '200%',
        animationName: 'stext-shine',
        animationDuration: '1s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      }}
    >
      {children}
    </div>
  )
}

/**
 * The legacy Text defaults: variant body2 (styled defaultVariants) and color
 * $neutral1 — user props override both. In loading state the text renders
 * transparent at opacity 0 under the placeholder bar. Exported so the
 * workbench safelist generator compiles the exact classNames the component
 * renders.
 */
export function resolveTextCompatDefaults({
  loading,
  props,
}: {
  loading: boolean | 'no-shimmer'
  props: TextCompatProps
}): TextCompatProps {
  return loading !== false
    ? { variant: 'body2', color: '$transparent', opacity: 0, ...props }
    : { variant: 'body2', color: '$neutral1', ...props }
}

export const TextCompat = React.forwardRef<HTMLElement, TextCompatProps>(function TextCompat(props, ref) {
  const { loading = false, loadingPlaceholderText = '000.00', ...rest } = props
  const styleProps = resolveTextCompatDefaults({ loading, props: rest })
  const tag = rest.tag ?? VARIANT_TAG[styleProps.variant ?? 'body2'] ?? 'span'

  const element = (
    <TextCompatFrame {...styleProps} tag={tag} ref={ref}>
      {/* children must not render while loading (they may still be fetching);
          the placeholder text sizes the loading bar instead, like the legacy Text. */}
      {loading ? loadingPlaceholderText : rest.children}
    </TextCompatFrame>
  )

  if (!loading) {
    return element
  }
  const placeholder = <TextCompatPlaceholder>{element}</TextCompatPlaceholder>
  return loading === 'no-shimmer' ? placeholder : <ShineWrapper>{placeholder}</ShineWrapper>
})

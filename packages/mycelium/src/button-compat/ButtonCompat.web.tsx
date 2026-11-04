/*
 * Drop-in Tailwind twin of the legacy ui (Tamagui) Button — same public API,
 * same visuals; it replaced that Button everywhere.
 * Grafted from the parity-verified workbench port (PR #36187, 2,912
 * computed-style cell-pairs / 0 mismatches). A Button is a bounded component,
 * so instead of the style-prop compiler pipeline (`../compat/compose`) it uses
 * cva + the shared `../cn`, with the [variant][emphasis] lookup tables
 * transcribed 1:1 from the legacy variantEmphasisHash files.
 *
 * This is the WEB leg of the standard three-file platform split (INFRA-3230):
 * a platformless base stub (`ButtonCompat.tsx`) that throws, this `.web.tsx`
 * implementation, and `ButtonCompat.native.tsx`. `apps/web`'s vite
 * `resolve.extensions` lists `.web.tsx` ahead of `.tsx` and has no `.native.*`
 * entry, so web resolves exactly this module; Metro prefers `.native.tsx`.
 *
 * The class surface itself lives in `./compile` — pure, platform-neutral, and
 * shared with the native leg. `web-class-pin.test.tsx` checks this leg renders
 * exactly the compiler's frame string.
 *
 * Colors are the `@universe/tailwind` semantic utilities: since #35388 that
 * palette matches the Tamagui theme value-for-value, so the workbench port's
 * `--btnv-*` palette is dropped. The one remaining font-stack pin
 * (`--sbtn-font-button`) is documented in `button-compat.css`.
 *
 * The frame transition stays scoped to transform + filter (non-color): legacy
 * CustomButtonFrame animates with `animateOnly: ['transform']`, and an unscoped
 * transition makes themed colors visibly ease on light/dark toggle.
 *
 * Known non-reproducible bits (noted, not silently dropped):
 * shouldAnimateBetweenLoadingStates is a legacy RN LayoutAnimation (no-op on
 * web, live on native); the iconPosition RTL swap is web-only-LTR.
 *
 * Intentional deviation from legacy (design-requested, INFRA-2955): disabled
 * buttons always render cursor: default — legacy keeps cursor: pointer when
 * onDisabledPress makes a disabled button interactive; here the disabled look
 * never advertises a pointer, even though the click still fires.
 */
import { createElement, forwardRef, type ButtonHTMLAttributes, type JSX, type KeyboardEvent } from 'react'
import { getMaybeHexOrRgbColor } from '../button-frame-compat/custom-color'
import { domTestId } from '../compat/dom-test-id'
import {
  buttonCompatFrameClassName,
  getContrastTextClass,
  isButtonDisabled,
  type ButtonContentClassProps,
} from './compile'
import { resolveWebButtonClickHandler } from './compose-press-handlers'
import { splitButtonCompatDimensionProps, splitButtonCompatMediaProps } from './dimensions'
import { getCustomStyle } from './web-custom-style'
import { buttonCompatWebDimensionLane } from './web-dimensions'
import type { ButtonCompatProps } from './web-props'
import { ButtonIcon, ButtonSpinner } from './web-slots'
import { ButtonContext, ButtonText } from './web-text'

// The public type + helper surface is mirrored on all three legs, so `./index` and every existing `from './ButtonCompat'` call site are unchanged whichever leg the bundler resolves.
export { getContrastTextClass } from './compile'
export type { ButtonEmphasis, ButtonFocusScaling, ButtonIconPosition, ButtonSize, ButtonVariant } from './compile'
// Named so a consumer can type a standalone shared handler outside JSX.
export type { ButtonPressHandler, NativeButtonPressEvent, WebButtonPressEvent } from './press-handler'
// The styled Button.Text (INFRA-3550) lives in ./web-text, Button.Icon and the
// spinner in ./web-slots (both max-lines extractions).
export type { ButtonIconProps } from './web-slots'
export type { ButtonTextProps } from './web-text'
// The public prop surface: own file, ./web-props (max-lines extraction) — the type EVERY consumer typechecks against (see that file's header).
export type { ButtonCompatProps } from './web-props'

/* ---------------------------------- Button ---------------------------------- */

interface FrameElement {
  /** `a` for the legacy link form (`tag="a"`), `button` otherwise. */
  element: 'a' | 'button'
  /** Props ahead of `className` — `type` on the button path. */
  lead: Record<string, unknown>
  /** Props after `className` — `disabled` (button), `href`/`target`/`rel` (enabled anchor), or the disabled anchor's focus/AT parity set. */
  kind: Record<string, unknown>
  /** Overrides the default disabled `-1` tab stop when set: the disabled-interactive anchor needs `0` — with `href` withheld it has no native one. */
  tabIndex?: number
}

/**
 * Keyboard activation for the disabled-interactive anchor (`href` withheld, so the
 * browser provides none): Enter — the link activation key — synthesizes the click a
 * native button fires itself, landing on the same detached `onDisabledPress` click
 * handler. Space deliberately unmapped: links scroll on Space; buttons fire.
 */
function activateOnEnter(event: KeyboardEvent<HTMLAnchorElement>): void {
  if (event.key === 'Enter') {
    event.currentTarget.click()
  }
}

/**
 * The frame element and its element-kind props (INFRA-3478). Split into the
 * `lead`/`kind` chunks so the button path's attribute ORDER stays stable for
 * the app snapshots: `type` sits ahead of `className`, `disabled` right after
 * it. The anchor form gets neither attribute —
 * `type` is meaningless and `disabled` invalid on `<a>`; disabled semantics
 * stay on `aria-disabled` + `tabIndex` + the detached click handler, matching
 * the compat DOM primitives' forwarding (`../compat/dom.tsx`).
 *
 * A DISABLED anchor additionally renders with NO `href` (nor `target`/`rel`):
 * `pointer-events-none` alone cannot detach an anchor's default navigation,
 * because `onDisabledPress` removes it (interactive-while-disabled) and the
 * platform-neutral press handler (./press-handler) cannot `preventDefault` —
 * a kept `href` would still navigate on click. With the attribute absent the
 * element is a non-link placeholder: no default navigation, and no browser
 * context-menu surface either (open in new tab / copy link address read the
 * attribute directly) — closing the context-menu gap legacy left open.
 *
 * An ENABLED anchor with a `target` but no caller `rel` defaults to
 * `rel="noopener"` (reverse-tabnabbing hardening — a deliberate deviation
 * from legacy, which forwarded `rel` untouched). A caller-passed `rel`
 * always wins.
 */
function getFrameElement({
  tag,
  type,
  href,
  target,
  rel,
  isDisabled,
  interactiveWhileDisabled,
}: {
  tag: 'a' | 'button' | undefined
  type: ButtonHTMLAttributes<HTMLButtonElement>['type']
  href: string | undefined
  target: string | undefined
  rel: string | undefined
  isDisabled: boolean
  interactiveWhileDisabled: boolean
}): FrameElement {
  if (tag === 'a') {
    if (isDisabled) {
      // Focus/AT parity with the disabled BUTTON path: withholding `href`
      // dropped this anchor out of the tab order and stripped its implicit
      // link role, making `onDisabledPress` mouse-only — while the disabled
      // button (no `disabled` attribute when interactive) keeps its role,
      // tab stop, and native keyboard activation. Restore all three: the
      // role always; the tab stop and Enter-to-click synthesis only while
      // `onDisabledPress` keeps the element interactive.
      return {
        element: 'a',
        lead: {},
        kind: { role: 'link', ...(interactiveWhileDisabled ? { onKeyDown: activateOnEnter } : undefined) },
        tabIndex: interactiveWhileDisabled ? 0 : undefined,
      }
    }
    return {
      element: 'a',
      lead: {},
      kind: { href, target, rel: rel ?? (target !== undefined ? 'noopener' : undefined) },
    }
  }
  return {
    element: 'button',
    lead: { type: type ?? 'button' },
    kind: { disabled: isDisabled && !interactiveWhileDisabled },
  }
}

// The ref lands on whichever frame element renders: an HTMLAnchorElement with
// `tag="a"`, an HTMLButtonElement otherwise — hence the union.
const ButtonComponent = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonCompatProps>(function ButtonCompat(
  {
    children,
    icon,
    fill = true,
    // accepted for API parity; legacy uses RN LayoutAnimation, which has no web effect
    shouldAnimateBetweenLoadingStates: _shouldAnimateBetweenLoadingStates = true,
    variant = 'default',
    focusScaling = 'default',
    emphasis = 'primary',
    size = 'medium',
    lineHeightDisabled = false,
    loading,
    iconPosition = 'before',
    disabled = false,
    onDisabledPress,
    onPress,
    onClick,
    backgroundColor,
    group,
    tag,
    href,
    target,
    rel,
    'primary-color': primaryColor,
    'dd-action-name': ddActionName,
    '$platform-web': platformWeb,
    testID,
    className,
    style,
    type,
    // Native-only (see ./web-props); destructured so it never rides `...rest`
    // onto the DOM element as an unrecognized attribute.
    hitSlop: _hitSlop,
    ...rest
  },
  ref,
): JSX.Element {
  const isDisabled = isButtonDisabled({ disabled, loading })
  const interactiveWhileDisabled = isDisabled && Boolean(onDisabledPress)
  // Composed, not `onPress ?? onClick` — Trace clone-injects `onClick`; see ./compose-press-handlers.
  const handleClick = resolveWebButtonClickHandler({ isDisabled, onPress, onClick, onDisabledPress })

  // The legacy split: only concrete hex/rgb takes the custom-background lane. A theme token rides
  // the emission lane below to a real `bg-*` class — inline it would be invalid CSS and dropped.
  const customBackgroundColor = getMaybeHexOrRgbColor(backgroundColor)
  const tokenBackgroundColor = customBackgroundColor === undefined ? backgroundColor : undefined

  const customTextClass = customBackgroundColor ? getContrastTextClass(customBackgroundColor) : undefined

  const ctx: ButtonContentClassProps = { variant, emphasis, size, isDisabled, customTextClass }

  // The media pools ($sm/$md/…) and the whole dimension/layout/spacing slice come out of the rest spread by
  // MEDIA_VARIANT key / DIMENSION_PROP_KEYS — never a hand list — so a prop added to either surface can
  // neither leak onto the DOM nor miss its lane.
  const { media, rest: afterMedia } = splitButtonCompatMediaProps(rest)
  const { dimensions, rest: domProps } = splitButtonCompatDimensionProps(afterMedia)

  // Dimension + layout props, their responsive media pools, and the top-level $platform-web pool
  // (applied unconditionally on this leg) render through the deterministic-emission path — in-set
  // classes verbatim, out-of-set values on a var-indirection twin plus an inline `--c*` custom
  // property (see ./dimensions). With none set, the caller's className/style pass through untouched.
  const laneProps = { ...dimensions, ...media, backgroundColor: tokenBackgroundColor, '$platform-web': platformWeb }
  const dimensionLane = buttonCompatWebDimensionLane({ ...laneProps, className, style })

  const customStyle = getCustomStyle({
    backgroundColor: customBackgroundColor,
    isDisabled,
    laneProps,
    primaryColor,
    style: dimensionLane.style,
  })

  const isTextChild = typeof children === 'string' || typeof children === 'number'
  // Legacy defaults the Datadog action name to the label when children is a string
  const ddActionProps = { 'dd-action-name': ddActionName ?? (typeof children === 'string' ? children : undefined) }

  const frame = getFrameElement({ tag, type, href, target, rel, isDisabled, interactiveWhileDisabled })
  // Widened so `createElement` takes its string overload (untyped props record,
  // the `../compat/dom.tsx` idiom): JSX cannot type a union intrinsic tag
  // carrying element-kind props.
  const frameElement: string = frame.element

  // Key order below reproduces the pre-INFRA-3478 JSX attribute order, which the app snapshots record.
  return (
    <ButtonContext.Provider value={ctx}>
      {createElement(
        frameElement,
        {
          ref,
          ...frame.lead,
          className: buttonCompatFrameClassName({
            size,
            iconPosition,
            fill,
            focusScaling,
            variant,
            emphasis,
            disabled,
            loading,
            onDisabledPress,
            backgroundColor: customBackgroundColor,
            group,
            className: dimensionLane.className,
          }),
          ...frame.kind,
          'aria-disabled': isDisabled || undefined,
          tabIndex: frame.tabIndex ?? (isDisabled && !interactiveWhileDisabled ? -1 : undefined),
          style: customStyle,
          onClick: handleClick,
          ...ddActionProps,
          ...domProps,
          ...domTestId(testID),
        },
        <>
          {!loading && icon ? <ButtonIcon>{icon}</ButtonIcon> : null}
          {loading ? <ButtonSpinner /> : null}
          {isTextChild ? <ButtonText lineHeightDisabled={lineHeightDisabled}>{children}</ButtonText> : children}
        </>,
      )}
    </ButtonContext.Provider>
  )
})

/** Drop-in Tailwind twin of the legacy `ui/src` Button, incl. Button.Text / Button.Icon. */
export const ButtonCompat = Object.assign(ButtonComponent, {
  Text: ButtonText,
  Icon: ButtonIcon,
})

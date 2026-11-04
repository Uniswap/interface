/**
 * The public prop contract of `IconButtonCompat` — the drop-in twin of the
 * legacy `ui/src` `IconButton`.
 *
 * The legacy type is CONSTRUCTED, not hand-listed:
 * `{ icon; size? } & OmitIncludingToLowercase<ButtonProps, 'flex' | 'icon' |
 * 'size' | 'height' | 'width'>`. This contract applies the same operator to
 * the compat's Button-tier surface (the `ButtonFrameCompat` variant + open
 * style contract plus the Button orchestration props), so the key set tracks
 * the legacy surface structurally instead of by a copyable list.
 *
 * `tsc` has no platform-extension resolution, so this module (via the base
 * leg) is what every consumer typechecks against; the press handlers keep the
 * shared DOM-typed contract and the native leg casts at its RN seam, the
 * `TouchableTextLinkCompat.native` mechanism.
 */
import type { JSX } from 'react'
import type { ButtonSize } from '../button-frame-compat/compile'
import type { ButtonFrameCompatProps } from '../button-frame-compat/props'

/**
 * Omit keys whose LOWERCASED name contains one of the (lowercased) strings —
 * transcribed verbatim from the legacy `IconButton.tsx` helper, since the
 * operator itself is part of the contract being mirrored: `'height'` drops
 * `lineHeightDisabled` as well as `minHeight`, `'icon'` drops `iconPosition`,
 * `'width'` drops `borderWidth`, exactly as on legacy.
 */
type OmitIncludingToLowercase<T, Str extends string> = {
  [K in keyof T as K extends string
    ? Lowercase<K> extends `${string}${Lowercase<Str>}${string}`
      ? never
      : K
    : never]: T[K]
}

/**
 * The compat Button-tier surface the omit runs over: the frame contract minus
 * its internal styling split (`isDisabled` — the public `disabled` below is
 * the legacy consumer-facing prop), plus the Button orchestration props,
 * mirroring how legacy `ButtonProps` builds over `CustomButtonFrameProps`.
 */
type IconButtonSurface = Omit<ButtonFrameCompatProps, 'isDisabled' | 'disabled'> & {
  /** Spinner replaces the icon in the button's text color; the button shows the disabled UI. */
  loading?: boolean
  /** Legacy RN LayoutAnimation flag — no-op on web, live on the native leg. */
  shouldAnimateBetweenLoadingStates?: boolean
  /** Disabled UI; blocks interaction unless onDisabledPress is provided. */
  disabled?: boolean
}

type OmittedIconButtonProps = OmitIncludingToLowercase<IconButtonSurface, 'flex' | 'icon' | 'size' | 'height' | 'width'>

export type IconButtonCompatProps = {
  /** The glyph, auto-themed and auto-sized ($icon.16/16/20/24/24) from the button's variant/emphasis/size. */
  icon: JSX.Element
  size?: ButtonSize
} & OmittedIconButtonProps

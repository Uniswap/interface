/**
 * The WEB leg's public `ButtonCompatProps` interface, extracted from
 * `ButtonCompat.web.tsx` purely for the oxlint `max-lines` cap (the same
 * pressure that extracted `./dimensions` and `./native-props`). This is the
 * type EVERY consumer typechecks against — `tsc` has no platform-extension
 * resolution, so the base stub (`./ButtonCompat.tsx`) re-exports this leg's
 * type, not the native leg's own (`./native-props.ts`) — see that file's own
 * header for the full rationale.
 *
 * The responsive `$sm`/`$md`/… pools and the top-level `$platform-web` pool
 * compose in from `./dimensions` (`$platform-web`: unconditional on this leg,
 * inert on native — the rationale lives there).
 */
import type { ButtonHTMLAttributes, JSX } from 'react'
import type { Insets } from 'react-native'
import type {
  BorderWidthValue,
  ColorValue,
  DisplayValue,
  OverflowValue,
  PositionValue,
  RadiusValue,
  SizeValue,
  SpaceValue,
} from '../compat/props'
import type { AlignItems, AlignSelf, JustifyContent } from '../flex-compat/props'
import type { ButtonEmphasis, ButtonFocusScaling, ButtonIconPosition, ButtonSize, ButtonVariant } from './compile'
import type { ButtonCompatMediaProps, ButtonCompatPlatformWebProps } from './dimensions'
import type { ButtonPressHandler } from './press-handler'

export interface ButtonCompatProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    ButtonCompatMediaProps,
    ButtonCompatPlatformWebProps {
  size?: ButtonSize
  variant?: ButtonVariant
  emphasis?: ButtonEmphasis
  /** Stretch to fill the parent (legacy default: true) */
  fill?: boolean
  focusScaling?: ButtonFocusScaling
  /** Auto-themed + auto-sized from the button's variant/emphasis/size */
  icon?: JSX.Element
  iconPosition?: ButtonIconPosition
  /** Spinner in the button text color; button becomes non-interactive */
  loading?: boolean
  /** Legacy RN LayoutAnimation flag — no-op on web, live on the native leg */
  shouldAnimateBetweenLoadingStates?: boolean
  /** Disabled UI; blocks interaction unless onDisabledPress is provided */
  disabled?: boolean
  /**
   * Keeps the button interactive while showing the disabled styling. Platform-neutrally
   * typed: the base stub re-exports THIS leg's props to every consumer, so a DOM event
   * type here would let shared code call `e.preventDefault()` and crash on device — see ./press-handler.
   */
  onDisabledPress?: ButtonPressHandler
  /** Legacy onPress; alias of onClick (onClick also works). Same neutral typing as onDisabledPress. */
  onPress?: ButtonPressHandler
  /** Drop the text line-height (languages with special characters) */
  lineHeightDisabled?: boolean
  /**
   * Background color. Hex/rgb takes the custom-background lane (inline paint, brightness filter,
   * auto-contrast text); a `$` theme token rides the ordinary colour lane like any style prop.
   */
  backgroundColor?: string
  /**
   * Width: number px, `$space` token (unknown → throw), or CSS length string.
   * Wired on BOTH legs, like gap.
   */
  width?: SizeValue
  /**
   * Height (legacy `height="$spacing36"`, the PositionsHeader create button):
   * same value contract as width. WEB-ONLY: the native leg accepts it for
   * call-site parity but applies nothing, dev-warning the drop
   * (`warnUnsupportedNativeProps`) instead of losing it in silence; wiring is
   * a deliberate non-goal until a native call site needs it.
   */
  height?: SizeValue
  /** Min width: same value contract as width */
  minWidth?: SizeValue
  /** Min height (legacy `minHeight="$spacing36"`, the DialogButtons action row) */
  minHeight?: SizeValue
  /** Max width: same value contract as width */
  maxWidth?: SizeValue
  /** Max height: same value contract as width */
  maxHeight?: SizeValue
  /** Main-axis alignment of the icon/label row (legacy `justifyContent="flex-start"`) — the frame default stays centered. Same web-only status as height */
  justifyContent?: JustifyContent
  /** Cross-axis alignment of the icon/label row (legacy `alignItems="center"`, the web DisconnectButton.tsx wallet row). Same web-only status as justifyContent */
  alignItems?: AlignItems
  /**
   * Icon/label row gap (legacy `gap="$spacing6"`): `$space` token (unknown → throw),
   * number px, `%`, or `auto`; beats the size variant's own gap. Wired on BOTH legs —
   * unlike height, the driving call sites are native-reachable (`packages/uniswap`),
   * so the native leg declares the resolved value through its style lane.
   */
  gap?: SpaceValue
  /** Padding shorthand (legacy `p={0}`): same value contract and both-leg status as gap; beats the size variant's padding. `p` wins when `padding` is also set (hand-check such call sites at conversion) */
  p?: SpaceValue
  padding?: SpaceValue
  /** Padding-axis/side family (legacy `py="$spacing12"` / `px="$spacing8"`): same `SpaceValue` contract and both-leg wired status as `p`; a side beats an axis beats `p` */
  px?: SpaceValue
  py?: SpaceValue
  pt?: SpaceValue
  pb?: SpaceValue
  pl?: SpaceValue
  pr?: SpaceValue
  /** Longhand spellings of the padding-side props above (shorthand wins when both are set, the p/padding rule) */
  paddingHorizontal?: SpaceValue
  paddingVertical?: SpaceValue
  paddingTop?: SpaceValue
  paddingBottom?: SpaceValue
  paddingLeft?: SpaceValue
  paddingRight?: SpaceValue
  /**
   * Margin family (legacy `mt="$spacing8"`, the ConfirmLimitOrderModal/Error.tsx retry button): same
   * `SpaceValue` contract and both-leg status as gap/p. The frame styles no margin at rest, so nothing is
   * contested; a side utility beats an axis one beats `m`, matching the legacy shorthand expansion.
   */
  m?: SpaceValue
  mx?: SpaceValue
  my?: SpaceValue
  mt?: SpaceValue
  mb?: SpaceValue
  ml?: SpaceValue
  mr?: SpaceValue
  /** Longhand spellings of the margins above; when both spellings of one prop are set, the shorthand wins on every leg (fixed order, the p/padding rule) */
  margin?: SpaceValue
  marginHorizontal?: SpaceValue
  marginVertical?: SpaceValue
  marginTop?: SpaceValue
  marginBottom?: SpaceValue
  marginLeft?: SpaceValue
  marginRight?: SpaceValue
  /** Flex grow factor (legacy `flex={1}`, WIRED on both legs since INFRA-3750 — the earn withdraw/deposit actions and NetworkCostEditor are native-reachable): `grow-[n] shrink`, basis left auto */
  flex?: number
  /** Flex basis (legacy `flexBasis={1}`, DappRequestContent footer): same SizeValue contract and web-only status as height; overrides the fill default's `basis-0` */
  flexBasis?: SizeValue
  /** Border radius (legacy `borderRadius="$roundedFull"`, the Auctions discovery CTA): `$rounded*` token / number → exact px (unknown token → throw), CSS strings verbatim; beats the size variant's radius. Same web-only status as height */
  borderRadius?: RadiusValue
  /** Cross-axis self-alignment (legacy `alignSelf="flex-start"`) — an enum lane like justifyContent; beats the fill default's `self-stretch`. Same web-only status as height */
  alignSelf?: AlignSelf
  /** Border color (legacy `borderColor="$neutral3"`): semantic token → `border-*` utility (unknown token → throw), non-token CSS values (`'unset'`) pass through. Beats the variant cell's border, and an explicit value beats the internal custom-`backgroundColor` border. Wired on BOTH legs, like gap */
  borderColor?: ColorValue
  /** CSS display (the shared enum lane: `none` → `hidden`); rides the media pools like the rest of this slice, so `$md={{ display: 'none' }}` breakpoint-hides the button. Same web-only status as height */
  display?: DisplayValue
  /** CSS `position` (legacy `position="relative"`): an enum lane like justifyContent. Same web-only status as height — native has no CSS `position` concept to map onto */
  position?: PositionValue
  /** Position offset (legacy `top={0}`): same `SpaceValue` contract as `p`. Same web-only status as `position` */
  top?: SpaceValue
  /**
   * Opacity (legacy `opacity={isViewOnlyWallet ? 0.4 : undefined}`, the mobile
   * SendFormButton.tsx view-only dimming). WIRED on both legs: plain 0-1
   * number, no token resolution.
   */
  opacity?: number
  /** Flex shrink factor (legacy `flexShrink={1}`, the mobile LandingScreen.tsx create-account CTA). WIRED on both legs, independent of `flex`. */
  flexShrink?: number
  /** Flex grow factor alone (legacy `flexGrow={1}`, the wallet BackupReminderContent/SmartWalletModal action rows). WIRED on both legs; a numeric `flex` set alongside wins. */
  flexGrow?: number
  /** Overflow (legacy `overflow="hidden"`, the PendingSwapButtonContent progress fill). WIRED on both legs; native drops the web-only `auto`/`clip`/`unset` values with a dev warning. */
  overflow?: OverflowValue
  /** Shadow color (legacy `shadowColor="$accent1"`): resolves through the shared shadow-color map (unknown token → throw on web); WIRED on both legs. */
  shadowColor?: ColorValue
  /** Shadow opacity (legacy `shadowOpacity={0.4}`): folds into the composed `box-shadow` color via `color-mix`; WIRED on both legs. */
  shadowOpacity?: number
  /** Shadow blur radius (legacy `shadowRadius="$spacing8"`): same `BorderWidthValue` contract as the shared shadow surface; WIRED on both legs. */
  shadowRadius?: BorderWidthValue
  /**
   * Hit-region padding (legacy `hitSlop={16}`, the mobile LandingScreen.tsx
   * create-account CTA). NATIVE-ONLY: accepted for call-site parity and
   * silently inert on web — a DOM button has no hit-slop concept, and legacy
   * Tamagui web drops it too.
   */
  hitSlop?: number | Insets | null
  /**
   * Caller-visible group anchor (legacy `group`, the KycActionButton
   * hover-reveal): `true` renders the `group` marker class, a name renders
   * `group/<name>` — what descendants' `$group-hover` pools target. Distinct
   * from the INTERNAL `group/sbtn` pool, which stays private to the
   * variant/emphasis cells. Same web-only status as height: the marker's
   * `group-*` variants don't resolve natively, so the native leg accepts the
   * prop and dev-warns the drop.
   */
  group?: string | boolean
  /**
   * The legacy link form: `tag="a"` renders an anchor instead of `<button>`, the public
   * `tag`/`href` surface the compat DOM primitives expose (`../compat/props.ts`). Only the
   * anchor form is sanctioned here — a Button is a bounded component, not a generic styled
   * view. WEB-ONLY like height: native accepts the link props for call-site parity but
   * mounts no anchor — it dev-warns the dropped navigation.
   */
  tag?: 'a' | 'button'
  /** Anchor href (with `tag="a"`), forwarded to the DOM like the compat primitives — withheld while disabled (see getFrameElement) */
  href?: string
  /** Anchor target (with `tag="a"`) */
  target?: string
  /** Anchor rel (with `tag="a"`); defaults to `noopener` when `target` is set and no rel is passed */
  rel?: string
  'primary-color'?: string
  'dd-action-name'?: string
  /** Legacy RN testID; alias of `data-testid` (wins over one in a spread), matching the compat DOM primitives (INFRA-3222) */
  testID?: string
}

import { type ComponentType, forwardRef, useRef } from 'react'
import {
  type DimensionValue,
  type FlexStyle,
  type GestureResponderEvent,
  Image as RNImage,
  type ImageProps as RNImageProps,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native'
import { buildPressHandlers, type PressTracker } from 'ui/src/components/Image/buildPressHandlers'
import { isWebRender } from 'ui/src/components/Image/isWebRender'
import { useIsXsBreakpoint } from 'ui/src/components/Image/useIsXsBreakpoint'
import { useSporeColors, type UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { borderRadii, gap, padding, spacing } from 'ui/src/theme'

const spacingTokens = { ...spacing, ...padding, ...gap }

type RadiusTokenValue = `$${keyof typeof borderRadii}` | number
type ColorTokenValue = `$${string & keyof UseSporeColorsReturn}`
type InsetValue = DimensionValue | string
/**
 * Legacy Tamagui sized width/height against the `size` token category, which this repo's
 * config aliases to the space map — so consumers pass numbers, percent strings, AND spacing
 * tokens (WalletAlertBadge passes `width="$spacing48"`). `string & {}` keeps token literals
 * assignable without collapsing the union for autocomplete.
 */
type SizeValue = DimensionValue | (string & {})

function resolveRadius(value: RadiusTokenValue | undefined): number | undefined {
  if (typeof value !== 'string') {
    return value
  }
  return borderRadii[value.slice(1) as keyof typeof borderRadii]
}

// The `size` token category legacy resolved dimensions against — this repo's config
// aliases it to the space map plus `true` (theme/tokens.ts: `const size = space`).
const sizeTokens = { ...spacingTokens, true: spacing.spacing8 }

/**
 * Token-valued width/height (WalletAlertBadge passes `width="$spacing48"`), per-renderer
 * as legacy behaved: the WEB pipeline silently DROPPED them (captured live from
 * @tamagui/image this session — no width/height declaration at all), while the NATIVE
 * driver resolved them through the `size` token category to raw numbers (@tamagui/web
 * propMapper: getTokenForKey → tokensParsed.size → resolveVariableValue). Unknown tokens
 * drop on both, as getTokenForKey omits values it cannot resolve.
 */
function resolveSize(value: SizeValue | undefined): DimensionValue | undefined {
  if (typeof value === 'string' && value.startsWith('$')) {
    if (isWebRender) {
      return undefined
    }
    const token = value.slice(1)
    return token in sizeTokens ? sizeTokens[token as keyof typeof sizeTokens] : undefined
  }
  return value as DimensionValue | undefined
}

/**
 * Tamagui's native driver expanded `objectFit` to a `resizeMode` STYLE via this exact map
 * (@tamagui/web webToNativeProps.native: unknown values fall back to 'cover'), which an
 * explicit `resizeMode` prop outranks in RN. On web the alias was never mapped — see the
 * objectFit note in the component.
 */
const OBJECT_FIT_TO_RESIZE_MODE: Record<string, NonNullable<RNImageProps['resizeMode']>> = {
  contain: 'contain',
  cover: 'cover',
  fill: 'stretch',
  none: 'center',
  'scale-down': 'contain',
}

// Tamagui coerced numeric-string positions (e.g. bottom="0") to px on web; mirror that so
// the same call sites resolve to identical layout on both style engines.
function resolveInset(value: InsetValue | undefined): DimensionValue | undefined {
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return value as DimensionValue | undefined
}

/**
 * RN types StyleSheet.flatten's result as non-optional, but the implementation returns
 * undefined for StyleProp's Falsy arm (false/''/null/undefined) — type the runtime truth.
 */
function flattenStyle(style: StyleProp<ImageStyle> | undefined): ImageStyle | undefined {
  return StyleSheet.flatten(style)
}

/**
 * Tamagui styled(Image, ...) wrappers (ModalTemplate's GradientImage/IconImage) deliver their
 * resolved token styles as `var(--t-space-<token>)` / `var(--t-radius-<token>)` strings on web.
 * Resolve them back to token values at this boundary so the value survives every style pipeline
 * (react-native-web and jsdom both drop var() values they cannot validate). Remove when the last
 * styled(Image) call sites — GradientImage/IconImage in
 * packages/uniswap/src/components/notifications/ModalTemplate.tsx — are converted off Tamagui
 * (tracked under INFRA-3318).
 */
function resolveTamaguiTokenVars(style: StyleProp<ImageStyle> | undefined): ImageStyle | undefined {
  // StyleProp's Falsy arm admits false/'' (`style={cond && {...}}`), and flatten returns
  // undefined for every falsy input — guard before enumerating.
  const flat = flattenStyle(style)
  if (!flat) {
    return undefined
  }
  const resolved: Record<string, unknown> = { ...flat }
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string') {
      continue
    }
    const match = /^var\(--t-(space|radius)-([A-Za-z0-9]+)\)$/.exec(value)
    if (!match) {
      continue
    }
    const [, group, token] = match
    if (group === 'space' && token !== undefined && token in spacingTokens) {
      resolved[key] = spacingTokens[token as keyof typeof spacingTokens]
    } else if (group === 'radius' && token !== undefined && token in borderRadii) {
      resolved[key] = borderRadii[token as keyof typeof borderRadii]
    }
  }
  return resolved as ImageStyle
}

export type ImageProps = {
  source?: ImageSourcePropType
  /** Legacy Tamagui shorthand: a string URL, converted to `source={{ uri: src }}` (with the resolved width/height on web). */
  src?: string
  alt?: string
  /**
   * Legacy Tamagui alias — on NATIVE it expands to a resizeMode that an explicit
   * `resizeMode` prop outranks; on WEB it only ever produced an inert `object-fit`
   * declaration (see the notes in the component body).
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  resizeMode?: RNImageProps['resizeMode']
  resizeMethod?: RNImageProps['resizeMethod']
  width?: SizeValue
  height?: SizeValue
  maxWidth?: SizeValue
  maxHeight?: SizeValue
  borderRadius?: RadiusTokenValue
  borderWidth?: number
  borderColor?: ColorTokenValue
  position?: FlexStyle['position']
  top?: InsetValue
  bottom?: InsetValue
  left?: InsetValue
  right?: InsetValue
  alignSelf?: FlexStyle['alignSelf']
  flexShrink?: number
  opacity?: number
  /** Web-only CSS cursor, forwarded into the inline style exactly as Tamagui resolved it. */
  cursor?: string
  /** Web-only CSS transition, forwarded into the inline style exactly as Tamagui resolved it. */
  transition?: string
  /**
   * Press handler, matching the legacy Tamagui signature (`| null` included — Tamagui's
   * styled() prop types require it). Web maps to onClick; native attaches responder
   * handlers so a scroll/gesture stealing the responder cancels the press, as Tamagui's
   * Pressability did. Note: Tamagui styled(Image) wrappers never forward `onPress` itself —
   * they deliver their own pressability handlers, which pass through with the rest props.
   */
  onPress?: ((event: GestureResponderEvent) => void) | null
  /**
   * Style overrides applied at or below the `$xs` breakpoint (max-width 380px),
   * matching the legacy Tamagui media prop's boundary behavior. Consumers pass
   * `{ width, height }` (the landing elements); typed structurally loose because
   * Tamagui's styled(Image) wrapper types must stay assignable to this prop.
   */
  $xs?: Record<string, unknown>
  testID?: string
  /**
   * RN image styles for direct consumers; the loose arm exists because Tamagui's
   * styled(Image) wrapper types (csstype-based unions) must stay assignable to this prop.
   */
  style?: StyleProp<ImageStyle> | StyleProp<object>
  onLoad?: RNImageProps['onLoad']
  onError?: RNImageProps['onError']
}

/** react-native-web forwards these web-only CSS declarations; native RN never receives them. */
type WebCSSImageStyle = Omit<ImageStyle, 'cursor' | 'objectFit'> & {
  cursor?: string
  transition?: string
  objectFit?: string
}

/**
 * The legacy component spread every non-style prop straight onto RN's Image
 * (`<RNImage ... {...rest} />` in @tamagui/image), and Tamagui styled() wrappers rely on
 * that: they deliver refs, pressability handlers (onClick/onMouseDown/onTouchEnd on web,
 * onStartShouldSetResponder/onResponder* on native), and data-* attributes as extra props.
 * RN's Image forwards unknown props to its host view at runtime even though its public
 * prop type omits them — widen the type once here rather than casting at call sites.
 */
const RNImageWithRestProps = RNImage as ComponentType<
  RNImageProps & { ref?: React.Ref<RNImage> } & Record<string, unknown>
>

type ImageStatics = {
  getSize: typeof RNImage.getSize
  getSizeWithHeaders: typeof RNImage.getSizeWithHeaders
  prefetch: typeof RNImage.prefetch
  prefetchWithMetadata: typeof RNImage.prefetchWithMetadata
  abortPrefetch: typeof RNImage.abortPrefetch
  queryCache: typeof RNImage.queryCache
}

/**
 * Legacy @tamagui/image: a string `src` becomes `{ uri }`, carrying the resolved width/height
 * on web so react-native-web derives the element's dimensions; otherwise `source` wins over
 * `src`, and ES-module asset objects (`{ default: ... }`) are unwrapped before rendering.
 * Native additionally unwraps a `{ uri: <number> }` require() descriptor (Image.native.js:31-37),
 * returning the descriptor's width/height as `descriptorStyle` — style backfill that loses to
 * every explicitly-set dimension, as legacy's `style.width ??=` did.
 */
function resolveFinalSource({
  source,
  src,
  resolvedWidth,
  resolvedHeight,
}: {
  source: ImageSourcePropType | undefined
  src: string | undefined
  resolvedWidth: DimensionValue | undefined
  resolvedHeight: DimensionValue | undefined
}): { source: ImageSourcePropType | undefined; descriptorStyle: ImageStyle | undefined } {
  let finalSource: ImageSourcePropType | undefined =
    typeof src === 'string'
      ? {
          uri: src,
          ...(isWebRender && {
            width: typeof resolvedWidth === 'number' ? resolvedWidth : undefined,
            height: typeof resolvedHeight === 'number' ? resolvedHeight : undefined,
          }),
        }
      : (source ?? undefined)
  let descriptorStyle: ImageStyle | undefined
  // ES-module asset unwrap runs FIRST so a `{ default: { uri: <number> } }` shape still
  // reaches the numeric-uri unwrap below — ordering must not matter.
  if (finalSource && typeof finalSource === 'object' && 'default' in finalSource) {
    finalSource = (finalSource as { default: ImageSourcePropType }).default
  }
  // A Metro require() asset id in the uri slot (UnitagBanner passes
  // `{ uri: UNITAGS_BANNER_* }` from @universe/mycelium/assets) MUST unwrap on native: Android's host
  // reads uri as a string, so a numeric uri crashes the bridge
  // (UnexpectedNativeTypeException). Web bundlers deliver string URLs, so the web leg never
  // sees this shape — legacy kept the unwrap native-only. Backfill dimensions from the
  // descriptor itself (legacy read the original source prop — identical values for the
  // only real shape, `{ uri, width, height }`).
  if (
    !isWebRender &&
    finalSource &&
    typeof finalSource === 'object' &&
    !Array.isArray(finalSource) &&
    typeof (finalSource as { uri?: unknown }).uri === 'number'
  ) {
    const descriptor = finalSource as { uri: ImageSourcePropType; width?: number; height?: number }
    finalSource = descriptor.uri
    descriptorStyle = { width: descriptor.width, height: descriptor.height }
  }
  return { source: finalSource, descriptorStyle }
}

/**
 * The legacy engine resolved style props in CONSUMER PROP ORDER — its inline declarations
 * land in the DOM in the order call sites pass them (DownloadWalletOption pins `height`
 * ahead of `width`; NetworkLogo pins `object-fit` ahead of both), so iterate the incoming
 * props rather than a fixed field list.
 */
function buildPropStyle(
  props: ImageProps,
  resolveColor: (token: ColorTokenValue | undefined) => string | undefined,
): WebCSSImageStyle {
  const out: Record<string, unknown> = {}
  // Read through a Record view: indexing `props[key]` over the `keyof ImageProps` union
  // collapses the value type in a way tsc versions disagree on (CI reported TS2367 on the
  // undefined guard); `unknown` keeps the guard meaningful under every tsc.
  const record: Record<string, unknown> = props
  for (const key of Object.keys(record) as (keyof ImageProps)[]) {
    const value = record[key]
    if (value === undefined) {
      continue
    }
    switch (key) {
      // objectFit on WEB rendering: legacy Tamagui consumed the alias into an inert
      // `object-fit` declaration on react-native-web's wrapper div (a non-replaced
      // element — no visual effect) and never derived resizeMode from it, so web painting
      // stayed at RNW's default `cover`. Captured live from @tamagui/image this session.
      // Keep the inert declaration for a byte-identical DOM; the native resizeMode
      // expansion lives on the resizeMode prop in the component body.
      case 'objectFit':
        if (isWebRender) {
          out['objectFit'] = value
        }
        break
      case 'width':
      case 'height':
      case 'maxWidth':
      case 'maxHeight': {
        const resolved = resolveSize(value as SizeValue)
        if (resolved !== undefined) {
          out[key] = resolved
        }
        break
      }
      case 'borderRadius':
        out['borderRadius'] = resolveRadius(value as RadiusTokenValue)
        break
      // Legacy Tamagui's cascade injected an explicit solid border-style whenever a border
      // width was set (captured live: all four border-*-style: solid inline declarations).
      case 'borderWidth':
        out['borderWidth'] = value
        out['borderStyle'] = 'solid'
        break
      case 'borderColor': {
        const resolved = resolveColor(value as ColorTokenValue)
        if (resolved !== undefined) {
          out['borderColor'] = resolved
        }
        break
      }
      case 'top':
      case 'bottom':
      case 'left':
      case 'right':
        out[key] = resolveInset(value as InsetValue)
        break
      case 'position':
      case 'alignSelf':
      case 'flexShrink':
      case 'opacity':
        out[key] = value
        break
      // cursor/transition are web-only CSS that the legacy Tamagui style pipeline forwarded
      // verbatim into react-native-web's style layer; native RN drops them, so gate here.
      case 'cursor':
      case 'transition':
        if (isWebRender) {
          out[key] = value
        }
        break
      default:
        break
    }
  }
  return out as WebCSSImageStyle
}

/**
 * Plain image, hand-rolled off Tamagui. Renders React Native's `Image` primitive on both
 * platforms — exactly what the legacy @tamagui/image wrapper rendered (react-native-web's
 * Image on web) — with the legacy Tamagui prop surface resolved to inline styles here.
 * Accepts `src` in addition to `source`, and `objectFit` as an alias for `resizeMode`,
 * mirroring the legacy wrapper's shorthands byte-for-byte.
 */
const ImageComponent = forwardRef<RNImage, ImageProps>(function Image(props, ref): JSX.Element {
  const {
    source,
    src,
    alt,
    objectFit,
    resizeMode,
    resizeMethod,
    width,
    height,
    maxWidth,
    maxHeight,
    borderRadius,
    borderWidth,
    borderColor,
    position,
    top,
    bottom,
    left,
    right,
    alignSelf,
    flexShrink,
    opacity,
    cursor,
    transition,
    onPress,
    $xs,
    testID,
    style,
    onLoad,
    onError,
    ...rest
  } = props as ImageProps & Record<string, unknown>
  const colors = useSporeColors()
  const isXs = useIsXsBreakpoint($xs !== undefined)

  const resolveColor = (token: ColorTokenValue | undefined): string | undefined => {
    if (token === undefined) {
      return undefined
    }
    // Read through a Partial view: an unknown token indexes to undefined at runtime even
    // though the keyof-typed access claims otherwise — legacy dropped the declaration
    // rather than throwing at render.
    const record: Partial<UseSporeColorsReturn> = colors
    const color = record[token.slice(1) as keyof UseSporeColorsReturn]
    return color === undefined ? undefined : String(color.val)
  }

  const { source: finalSource, descriptorStyle } = resolveFinalSource({
    source,
    src,
    resolvedWidth: resolveSize(width),
    resolvedHeight: resolveSize(height),
  })
  const propStyle = buildPropStyle(props, resolveColor)
  // SAFETY: consumers pass plain dimension overrides (see the $xs prop docs); the loose
  // typing exists only to keep Tamagui styled() wrapper types assignable.
  const mediaStyle: ImageStyle | undefined = isXs && $xs !== undefined ? ($xs as ImageStyle) : undefined
  const pressTracker = useRef<PressTracker>({ region: null, inside: true })
  const pressHandlers = buildPressHandlers(onPress, pressTracker.current)

  return (
    <RNImageWithRestProps
      {...rest}
      {...pressHandlers}
      ref={ref}
      // Native: objectFit maps through Tamagui's expansion table, and an explicit
      // resizeMode outranks it (RN resolves the prop above the expanded style — same
      // ordering collapsed into one expression). Web: only resizeMode ever painted.
      resizeMode={
        resizeMode ??
        (!isWebRender && objectFit !== undefined ? (OBJECT_FIT_TO_RESIZE_MODE[objectFit] ?? 'cover') : undefined)
      }
      resizeMethod={resizeMethod}
      // SAFETY: renders without a source only when a caller passed neither source nor src,
      // which the legacy wrapper equally forwarded as undefined.
      source={finalSource as ImageSourcePropType}
      alt={alt}
      testID={testID}
      style={[
        // First entry = lowest precedence: the native require-descriptor's dimensions
        // backfill only what nothing else set, as legacy's `style.width ??=` did.
        descriptorStyle,
        // SAFETY: WebCSSImageStyle only widens ImageStyle with web-only CSS strings that the
        // legacy pipeline forwarded through react-native-web's style layer unchanged.
        propStyle as ImageStyle,
        // SAFETY: the Record arm of `style` only widens for Tamagui wrapper typing; values
        // are the same resolved style objects either way.
        resolveTamaguiTokenVars(style as StyleProp<ImageStyle>),
        mediaStyle,
      ]}
      onLoad={onLoad}
      onError={onError}
    />
  )
})

ImageComponent.displayName = 'Image'

// Legacy @tamagui/image re-exposed RN Image's statics on the wrapper; keep that surface
// (react-native-web provides getSize/prefetch/queryCache; the rest exist on native only,
// exactly as before).
export const Image: typeof ImageComponent & ImageStatics = Object.assign(ImageComponent, {
  getSize: RNImage.getSize,
  getSizeWithHeaders: RNImage.getSizeWithHeaders,
  prefetch: RNImage.prefetch,
  prefetchWithMetadata: RNImage.prefetchWithMetadata,
  abortPrefetch: RNImage.abortPrefetch,
  queryCache: RNImage.queryCache,
})

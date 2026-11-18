import {
  Flex,
  iconSizes,
  Loader,
  Text,
  UniversalImage,
  type UniversalImageProps,
  UniversalImageResizeMode,
  validColor,
  zIndexes,
} from '@universe/mycelium'
import { useColorSchemeFromSeed, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TOKEN_LOGO_STYLES } from '@universe/transactions-ui/src/common/TokenLogo/tokenLogoStyles'
import { memo, type ReactNode, useState } from 'react'

/** A remote URL, a local path, or a bundled `require()` asset. */
export type TokenLogoImageSource = NonNullable<UniversalImageProps['uri']>

/**
 * The small badge on the logo's bottom-right corner. `network`: the chain the token is on.
 * `networkCount`: how many chains a multichain token spans; shown only when above 1, so
 * the adapter passes it only then.
 */
export type TokenLogoBadge =
  | {
      kind: 'network'
      /** The chain logo, normally a bundled asset from `@universe/mycelium/assets`. */
      logo: TokenLogoImageSource
      /** Kept so e2e selectors survive: the old NetworkLogo stamped `network-logo-<chainId>`. */
      testID?: string
    }
  | { kind: 'networkCount'; count: number }

export interface TokenLogoProps {
  /** The token image. Missing or failing to load renders the symbol badge. */
  url?: TokenLogoImageSource
  /** Raw symbol: the fallback badge shows its first 3 characters. */
  symbol?: string
  /** Seeds the fallback badge colors, so a token keeps its colors across sessions. Defaults to `symbol`. */
  name?: string
  /** Outer size in px, badge included. Default 40. */
  size?: number
  badge?: TokenLogoBadge
  /** Border around the badge. Default 1.5 on web, 2 on native. */
  badgeBorderWidth?: number
  /** The token is on a testnet: a dashed ring, no white disc behind the image. */
  isTestnet?: boolean
  isLoading?: boolean
  /**
   * CSS transition for a logo that resizes in place, e.g. a collapsing header:
   * `width 0.2s, height 0.2s`. Name the properties; never `all`.
   */
  transition?: string
  testID?: string
}

// Relative to `size`.
const BADGE_SIZE_RATIO = 0.4
const SQUIRCLE_BORDER_RADIUS_RATIO = 0.3
const TESTNET_BORDER_DIVISOR = 15
const TESTNET_BORDER_OFFSET = 4
// Prevents a gap between the chain logo and its border at some zoom levels.
const SUBPIXEL_COMPENSATION = 1

const BADGE_MAX_SYMBOL_CHARACTERS = 3
// Per side, at icon32 and up. Scaled down on smaller logos so it never eats the whole width.
const BADGE_HORIZONTAL_PADDING = 8
const BADGE_BASE_FONT_SIZE = 17
const BADGE_WEB_FONT_SIZE = 10
const COUNT_BADGE_MAX_FONT_SIZE = 13
const COUNT_BADGE_FONT_SIZE_RATIO = 0.8

/** A 1-2 character ticker fits at the base size; 3 characters (most ERC20s) start smaller. */
function getBadgeFontScale(characterCount: number): number {
  return characterCount > 2 ? 2 / characterCount : 1
}

function getBadgeOuterSize(sizeWithoutBorder: number, borderWidth: number): number {
  return sizeWithoutBorder + 2 * borderWidth
}

/**
 * A token's logo: the image on a white disc, a colored symbol badge when there is no
 * image, an optional network or chain-count badge, and a dashed ring on testnets.
 *
 * Data in, no lookups: the adapter resolves the chain logo, whether to show it and
 * whether the chain is a testnet (getChainInfo, shouldShowNetworkLogo, isTestnetChain).
 * Replaces the markup of TokenLogo and of the NetworkLogo badge it renders; CurrencyLogo
 * becomes a thin adapter that maps CurrencyInfo onto these props.
 */
export const TokenLogo = memo(function TokenLogoInner({
  url,
  symbol,
  name,
  size = iconSizes.icon40,
  badge,
  badgeBorderWidth = TOKEN_LOGO_STYLES.badgeBorderWidth,
  isTestnet = false,
  isLoading,
  transition,
  testID = 'token-logo',
}: TokenLogoProps): JSX.Element {
  const [showBackground, setShowBackground] = useState(TOKEN_LOGO_STYLES.showBackgroundBeforeLoad)
  const colors = useSporeColors()
  const { foreground, background } = useColorSchemeFromSeed(name ?? symbol ?? '')

  if (isLoading) {
    return <Loader.Box borderRadius="$roundedFull" height={size} testID={testID} width={size} />
  }

  const testnetBorderWidth = isTestnet ? size / TESTNET_BORDER_DIVISOR : 0
  const tokenSize = size - testnetBorderWidth - (isTestnet ? TESTNET_BORDER_OFFSET : 0)
  const badgeSize = Math.round(size * BADGE_SIZE_RATIO)

  const badgeText = symbol?.slice(0, BADGE_MAX_SYMBOL_CHARACTERS)
  const badgeFontScale = getBadgeFontScale(badgeText?.length ?? 0)
  const badgeHorizontalPadding = Math.min(BADGE_HORIZONTAL_PADDING, tokenSize / 4)
  // Hard cap so long text shrinks (native) or clips (web) instead of overflowing the circle.
  const badgeInnerWidth = Math.max(tokenSize - badgeHorizontalPadding * 2, 0)

  const fallback = (
    <Flex
      alignItems="center"
      borderRadius="$roundedFull"
      height={tokenSize}
      justifyContent="center"
      px={badgeHorizontalPadding}
      style={{ backgroundColor: background }}
      width={tokenSize}
    >
      <Text
        adjustsFontSizeToFit
        $platform-web={{
          // adjustsFontSizeToFit is native-only, so web sizes the text itself.
          fontSize: BADGE_WEB_FONT_SIZE * badgeFontScale,
          // No explicit lineHeight: forcing it to fontSize clips ascenders on some fonts.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'clip',
          maxWidth: badgeInnerWidth,
          // Text is an inline span on web, where maxWidth and overflow are no-ops.
          display: 'inline-block',
        }}
        // Android can otherwise top-align text within its line box. No-op on iOS.
        $platform-native={{ textAlignVertical: 'center' }}
        allowFontScaling={false}
        color={validColor(foreground)}
        fontFamily="$button"
        fontSize={BADGE_BASE_FONT_SIZE * badgeFontScale}
        fontWeight="500"
        lineHeight={TOKEN_LOGO_STYLES.fallbackLineHeight}
        maxWidth={badgeInnerWidth}
        minimumFontScale={0.5}
        numberOfLines={1}
        textAlign="center"
      >
        {badgeText}
      </Text>
    </Flex>
  )

  return (
    <Flex
      alignItems="center"
      height={size}
      justifyContent="center"
      pointerEvents="auto"
      position="relative"
      testID={testID}
      transition={transition}
      width={size}
    >
      {!isTestnet && (
        <Flex
          backgroundColor={colors.white.val}
          borderRadius="$roundedFull"
          height="96%"
          left="2%"
          opacity={showBackground ? 1 : 0}
          position="absolute"
          top="2%"
          transition={transition}
          width="96%"
          zIndex={zIndexes.background}
        />
      )}

      <UniversalImage
        allowLocalUri
        alt=""
        fallback={fallback}
        size={{ height: tokenSize, width: tokenSize, resizeMode: UniversalImageResizeMode.Cover }}
        // A high radius maps to a full circle without CSS animation issues.
        style={{ image: { borderRadius: size, zIndex: zIndexes.default, ...(transition && { transition }) } }}
        testID="token-image"
        uri={url}
        onLoad={() => setShowBackground(true)}
      />

      {isTestnet && (
        <Flex
          borderColor="$neutral3"
          borderRadius="$roundedFull"
          borderStyle="dashed"
          borderWidth={testnetBorderWidth}
          height={size}
          position="absolute"
          style={{ boxSizing: 'border-box' }}
          transition={transition}
          width={size}
        />
      )}

      {badge?.kind === 'network' && (
        <BadgePosition>
          <NetworkBadge borderWidth={badgeBorderWidth} logo={badge.logo} size={badgeSize} testID={badge.testID} />
        </BadgePosition>
      )}
      {badge?.kind === 'networkCount' && (
        <BadgePosition>
          <NetworkCountBadge borderWidth={badgeBorderWidth} count={badge.count} sizeWithoutBorder={badgeSize} />
        </BadgePosition>
      )}
    </Flex>
  )
})

function BadgePosition({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
      {children}
    </Flex>
  )
}

function NetworkBadge({
  logo,
  size: sizeWithoutBorder,
  borderWidth,
  testID,
}: {
  logo: TokenLogoImageSource
  size: number
  borderWidth: number
  testID?: string
}): JSX.Element {
  const colors = useSporeColors()
  const size = getBadgeOuterSize(sizeWithoutBorder, borderWidth)
  // Keeps the border from cutting off the logo.
  const imageSize = size + SUBPIXEL_COMPENSATION - borderWidth * 2

  return (
    <Flex
      centered
      overflow="hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * SQUIRCLE_BORDER_RADIUS_RATIO,
        borderWidth,
        borderColor: colors.surface1.val,
      }}
      testID={testID}
      zIndex={zIndexes.mask}
    >
      <UniversalImage
        allowLocalUri
        alt=""
        size={{ height: imageSize, width: imageSize, resizeMode: UniversalImageResizeMode.Contain }}
        uri={logo}
      />
    </Flex>
  )
}

/** Same size and shape as the network badge, so a multichain row lines up with single-chain rows. */
function NetworkCountBadge({
  count,
  sizeWithoutBorder,
  borderWidth,
}: {
  count: number
  sizeWithoutBorder: number
  borderWidth: number
}): JSX.Element {
  const colors = useSporeColors()
  const outerSize = getBadgeOuterSize(sizeWithoutBorder, borderWidth)
  // buttonLabel4 overflows small badges (icon24 gives a 10px inner size), so scale to the badge.
  const fontSize = Math.min(COUNT_BADGE_MAX_FONT_SIZE, Math.round(sizeWithoutBorder * COUNT_BADGE_FONT_SIZE_RATIO))

  return (
    <Flex
      centered
      backgroundColor="$surface3Solid"
      borderColor={colors.surface1.val}
      borderRadius={outerSize * SQUIRCLE_BORDER_RADIUS_RATIO}
      borderWidth={borderWidth}
      height={outerSize}
      testID="multichain-count-badge"
      width={outerSize}
    >
      <Text
        $platform-native={{ textAlignVertical: 'center' }}
        $platform-web={{ whiteSpace: 'nowrap' }}
        adjustsFontSizeToFit={TOKEN_LOGO_STYLES.fitCountText}
        allowFontScaling={false}
        color="$neutral1"
        // Top-level so uniwind drops the variant's line-height class too.
        fontSize={fontSize}
        lineHeight={fontSize}
        minimumFontScale={0.7}
        numberOfLines={TOKEN_LOGO_STYLES.fitCountText ? 1 : undefined}
        variant="buttonLabel4"
      >
        {count > 99 ? '99+' : String(count)}
      </Text>
    </Flex>
  )
}

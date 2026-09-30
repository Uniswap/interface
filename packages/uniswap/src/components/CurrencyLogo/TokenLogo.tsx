import { UniverseChainId } from '@universe/chains'
import { isMobileApp } from '@universe/environment'
import {
  Flex,
  iconSizes,
  Loader,
  Text,
  UniversalImage,
  UniversalImageResizeMode,
  validColor,
  zIndexes,
} from '@universe/mycelium'
import { useColorSchemeFromSeed, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { memo, ReactNode, useState } from 'react'
import { getBadgeBorderRadius, getBadgeOuterSize } from 'uniswap/src/components/CurrencyLogo/badgeSizeUtils'
import { STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/constants'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

interface TokenLogoProps {
  url?: string | null
  symbol?: string
  name?: string | null
  chainId?: UniverseChainId | null
  size?: number
  hideNetworkLogo?: boolean
  alwaysShowNetworkLogo?: boolean
  networkCount?: number
  networkLogoBorderWidth?: number
  loading?: boolean
  webFontSize?: number
  transition?: string
  /** Controls how the image fills the circular logo. Defaults to Cover so non-square images are cropped to the circle. */
  imageResizeMode?: UniversalImageResizeMode
}

function Badge({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Flex bottom={-2} position="absolute" right={-3} zIndex={zIndexes.mask}>
      {children}
    </Flex>
  )
}

const TESTNET_BORDER_DIVISOR = 15
const BORDER_OFFSET = 4
const BADGE_MAX_SYMBOL_CHARACTERS = 3
// Target horizontal padding (each side) for the fallback badge at icon32+ sizes. Scaled down for
// smaller badges (e.g. icon16/icon24) so it never eats the whole width and leaves no room for text.
const BADGE_HORIZONTAL_PADDING = 8
const BADGE_BASE_FONT_SIZE = 17
const COUNT_BADGE_MAX_FONT_SIZE = 13
const COUNT_BADGE_FONT_SIZE_RATIO = 0.8

/**
 * The fallback badge shows up to `BADGE_MAX_SYMBOL_CHARACTERS` characters. A 1-2 character ticker
 * (e.g. "V4") fits comfortably at the base font size, but a 3-character one (e.g. "ZBA" — the
 * common case, since most ERC20 tickers are exactly 3 characters) needs a smaller starting font
 * size to avoid overflowing the circular badge before `adjustsFontSizeToFit`/width-clamping kicks in.
 */
function getBadgeFontScale(characterCount: number): number {
  return characterCount > 2 ? 2 / characterCount : 1
}

/** Gray circular badge showing network count; same size and shape as NetworkLogo for consistency. */
function MultichainCountBadge({
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
  const borderRadius = getBadgeBorderRadius(outerSize, 'square')
  // buttonLabel4 (13px, ~15px line) overflows small badges (e.g. icon24 → 10px inner),
  // so scale the text to the badge's inner size.
  const fontSize = Math.min(COUNT_BADGE_MAX_FONT_SIZE, Math.round(sizeWithoutBorder * COUNT_BADGE_FONT_SIZE_RATIO))

  return (
    <Badge>
      <Flex
        centered
        width={outerSize}
        height={outerSize}
        borderRadius={borderRadius}
        backgroundColor="$surface3Solid"
        borderWidth={borderWidth}
        borderColor={colors.surface1.val}
        testID="multichain-count-badge"
      >
        <Text
          allowFontScaling={false}
          color="$neutral1"
          variant="buttonLabel4"
          $platform-web={{ whiteSpace: 'nowrap' }}
          $platform-native={{ textAlignVertical: 'center' }}
          // Top-level so uniwind drops the variant's line-height class too (see fallback badge below).
          fontSize={fontSize}
          lineHeight={fontSize}
          // RN-only: shrinks 3-char counts ("99+") that don't fit at the scaled size.
          adjustsFontSizeToFit={isMobileApp}
          minimumFontScale={0.7}
          // On web numberOfLines clamps to the badge width and ellipsizes, so small badges (icon24)
          // render "…" instead of the count. Let the digits overflow the square; the parent centers them.
          numberOfLines={isMobileApp ? 1 : undefined}
        >
          {count > 99 ? '99+' : String(count)}
        </Text>
      </Flex>
    </Badge>
  )
}

function NetworkLogoBadge({
  chainId,
  size,
  borderWidth,
}: {
  chainId: UniverseChainId | null
  size: number
  borderWidth: number
}): JSX.Element {
  return (
    <Badge>
      <NetworkLogo borderWidth={borderWidth} chainId={chainId} size={size} />
    </Badge>
  )
}

/** Exported for unit tests. */
export function shouldShowNetworkLogo({
  chainId,
  alwaysShowNetworkLogo,
  hideNetworkLogo,
  showMainnetNetworkLogo,
}: {
  chainId: UniverseChainId | null | undefined
  alwaysShowNetworkLogo: boolean | undefined
  hideNetworkLogo: boolean | undefined
  showMainnetNetworkLogo: boolean
}): boolean {
  if (alwaysShowNetworkLogo && chainId) {
    return true
  }
  if (!hideNetworkLogo && !!chainId) {
    // Historically we hid the Ethereum badge on mainnet; with multichain UX we show it for clarity.
    return chainId !== UniverseChainId.Mainnet || showMainnetNetworkLogo
  }
  return false
}

export const TokenLogo = memo(function TokenLogoInner({
  url,
  symbol,
  name,
  chainId,
  size = iconSizes.icon40,
  hideNetworkLogo,
  alwaysShowNetworkLogo,
  networkCount,
  networkLogoBorderWidth = isMobileApp ? 2 : 1.5,
  loading,
  webFontSize = 10,
  transition,
  imageResizeMode = UniversalImageResizeMode.Cover,
}: TokenLogoProps): JSX.Element {
  const isTestnetToken = !!chainId && isTestnetChain(chainId)

  // We want to avoid the extra render on mobile when updating the state, so we set this to `true` from the start.
  const [showBackground, setShowBackground] = useState(isMobileApp ? true : false)

  const colors = useSporeColors()
  const { foreground, background } = useColorSchemeFromSeed(name ?? symbol ?? '')

  const borderWidth = isTestnetToken ? size / TESTNET_BORDER_DIVISOR : 0

  const showMultichainCountBadge = networkCount !== undefined && networkCount > 1
  const showNetworkLogo = shouldShowNetworkLogo({
    alwaysShowNetworkLogo,
    hideNetworkLogo,
    chainId,
    showMainnetNetworkLogo: true,
  })
  const networkLogoSize = Math.round(size * STATUS_RATIO)

  const borderOffset = isTestnetToken ? BORDER_OFFSET : 0

  const tokenSize = size - borderWidth - borderOffset

  if (loading) {
    return <Loader.Box borderRadius="$roundedFull" height={size} width={size} />
  }

  const badgeText = symbol?.slice(0, BADGE_MAX_SYMBOL_CHARACTERS)
  const badgeFontScale = getBadgeFontScale(badgeText?.length ?? 0)
  // Cap padding at a quarter of tokenSize (per side) so it never consumes the full width on small
  // badges (e.g. icon16/icon24) — matches BADGE_HORIZONTAL_PADDING at icon32+ where 8 <= tokenSize / 4.
  const badgeHorizontalPadding = Math.min(BADGE_HORIZONTAL_PADDING, tokenSize / 4)
  // Available horizontal space for the glyphs once the badge's own padding is subtracted; used as
  // a hard cap so long text shrinks (native) or clips (web, via the inline-block below) instead of
  // overflowing the circle.
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
          // adjustFontSizeToFit is a react-native-only prop
          fontSize: webFontSize * badgeFontScale,
          // No explicit lineHeight: forcing it to equal fontSize clips ascenders/accents on some
          // fonts because the glyph's actual rendered height (ascent + descent) can exceed the
          // nominal em-square. Let the browser's natural line box render and center via the
          // parent Flex's alignItems/justifyContent instead.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'clip',
          maxWidth: badgeInnerWidth,
          // Text renders as an inline span on web, where maxWidth/overflow are no-ops; inline-block
          // makes the clamp above actually apply instead of only visually working by coincidence.
          display: 'inline-block',
        }}
        $platform-native={{
          // Android can otherwise top-align text within its line box; force vertical centering.
          // No-op on iOS.
          textAlignVertical: 'center',
        }}
        allowFontScaling={false}
        color={validColor(foreground)}
        fontFamily="$button"
        fontSize={BADGE_BASE_FONT_SIZE * badgeFontScale}
        fontWeight="500"
        // Skip variant's lineHeight so adjustsFontSizeToFit shrinks the line box with the
        // glyphs. Must be top-level: $platform-native only omits the RN style; uniwind still
        // applies body2's line-height class.
        lineHeight={isMobileApp ? 'unset' : undefined}
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
      testID="token-logo"
      pointerEvents="auto"
      width={size}
      position="relative"
      transition={transition}
    >
      {!isTestnetToken && (
        <Flex
          opacity={showBackground ? 1 : 0}
          height="96%"
          width="96%"
          zIndex={zIndexes.background}
          backgroundColor={colors.white.val}
          position="absolute"
          top="2%"
          left="2%"
          borderRadius="$roundedFull"
          transition={transition}
        />
      )}

      <UniversalImage
        allowLocalUri
        fallback={fallback}
        size={{ height: tokenSize, width: tokenSize, resizeMode: imageResizeMode }}
        style={{
          image: {
            // High value auto-maps to max, preventing CSS animation issues
            borderRadius: size,
            zIndex: zIndexes.default,
            ...(transition && { transition }),
          },
        }}
        testID="token-image"
        uri={url ?? undefined}
        onLoad={() => setShowBackground(true)}
      />

      {isTestnetToken && (
        <Flex
          borderRadius="$roundedFull"
          // Dashed everywhere. Only Android's legacy renderer dropped the dash and
          // drew this ring solid — a renderer gap, not a design choice; iOS and web
          // always rendered it dashed.
          borderStyle="dashed"
          borderColor="$neutral3"
          borderWidth={borderWidth}
          height={size}
          width={size}
          style={{ boxSizing: 'border-box' }}
          position="absolute"
          transition={transition}
        />
      )}

      {showMultichainCountBadge ? (
        <MultichainCountBadge
          count={networkCount}
          sizeWithoutBorder={networkLogoSize}
          borderWidth={networkLogoBorderWidth}
        />
      ) : (
        showNetworkLogo && (
          <NetworkLogoBadge borderWidth={networkLogoBorderWidth} chainId={chainId ?? null} size={networkLogoSize} />
        )
      )}
    </Flex>
  )
})

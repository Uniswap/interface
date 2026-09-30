import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { CSSProperties } from 'react'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { EllipsisText } from '~/components/Table/shared/TableText'
import {
  COLLAPSE_PROGRESS,
  COLLAPSE_TEXT_VISIBILITY_VAR,
  COLLAPSED_LOGO_SIZE,
  EXPANDED_LOGO_GAP_PX,
  EXPANDED_LOGO_SIZE,
  TEXT_FADE_END_PROGRESS,
} from '~/pages/Launches/tokenColumnCollapse'

/**
 * Collapsed geometry: the 72px column less its cell padding (8px pinned + 12px `Cell`, both sides)
 * leaves a 32px content box — exactly the logo's layout box once the gap has closed and the text
 * block has been squeezed to zero, so the logo lands centered in the column. The scale-up to 36px is
 * a transform, so it costs no layout width and stays clear of `Cell`'s `overflow: hidden`.
 */
const rowStyle: CSSProperties = {
  columnGap: `calc((1 - ${COLLAPSE_PROGRESS}) * ${EXPANDED_LOGO_GAP_PX}px)`,
}

const logoStyle: CSSProperties = {
  flexShrink: 0,
  transform: `scale(calc(1 + ${COLLAPSE_PROGRESS} * ${COLLAPSED_LOGO_SIZE / EXPANDED_LOGO_SIZE - 1}))`,
}

// Fades out over the first 55% of the collapse; calc() clamps opacity into [0, 1] on its own. The
// visibility custom property (set by the hook at the same threshold) takes the faded text out of the
// accessibility tree as well — opacity 0 alone would still be announced.
const textStyle: CSSProperties = {
  opacity: `calc((${TEXT_FADE_END_PROGRESS} - ${COLLAPSE_PROGRESS}) / ${TEXT_FADE_END_PROGRESS})`,
  // A custom property is a valid `visibility` value at runtime, but not in React's keyword union.
  visibility: `var(${COLLAPSE_TEXT_VISIBILITY_VAR}, visible)` as CSSProperties['visibility'],
}

/**
 * Mobile token cell for the launch table: the expanded state matches Explore's `TokenDescription`,
 * but every piece interpolates against the scroll-linked collapse progress (see
 * `useTokenColumnCollapse`) — the name/symbol fade out and the logo scales up, leaving a centered
 * logo-only column.
 *
 * The expanded layout restates TokenDescription's rather than composing it because the collapse has
 * to interpolate its parts independently (logo scale, text opacity, the gap between them), which a
 * wrapper around that component cannot reach; it also drops the hover-to-copy address affordance,
 * which mobile has no way to trigger.
 */
export function CollapsibleTokenCell({
  name,
  symbol,
  chainId,
  logoUrl,
}: {
  name: string
  symbol: string
  chainId: UniverseChainId | undefined
  logoUrl?: string
}): JSX.Element {
  return (
    <Flex row alignItems="center" width="100%" style={rowStyle}>
      <Flex style={logoStyle}>
        <TokenLogo chainId={chainId} name={name} size={EXPANDED_LOGO_SIZE} symbol={symbol} url={logoUrl} />
      </Flex>
      <Flex flex={1} minWidth={0} style={textStyle}>
        <EllipsisText variant="body2" data-testid={TestID.TokenName}>
          {name}
        </EllipsisText>
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {symbol}
        </Text>
      </Flex>
    </Flex>
  )
}

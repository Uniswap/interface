import { TradingApi } from '@universe/api'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { CopyAlt } from '@universe/mycelium/icons/CopyAlt'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type {
  PositionedRouteLink,
  PositionedRouteNode,
} from 'uniswap/src/utils/routingDiagram/routeGraph/layoutRouteSankey'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'

export const LINK_HOVER_CARD_WIDTH = 240
export const NODE_HOVER_CARD_WIDTH = 150
const COPIED_RESET_MS = 1000
export const BPS_PER_PERCENT = 100
const PIPS_PER_PERCENT = 10_000
const THUMB_SIZE = 12

export type HoverContent =
  | { kind: 'link'; link: PositionedRouteLink; from: PositionedRouteNode; to: PositionedRouteNode }
  | { kind: 'node'; node: PositionedRouteNode; shareBps: number }

export interface HoverState {
  content: HoverContent
  /** Card position relative to the diagram wrapper. */
  x: number
  y: number
}

export function RouteSankeyHoverCard({
  hover,
  logoUrlByTokenKey,
  onEnter,
  onLeave,
}: {
  hover: HoverState
  logoUrlByTokenKey: ReadonlyMap<string, string>
  onEnter: () => void
  onLeave: () => void
}): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const { content, x, y } = hover
  if (content.kind === 'node') {
    return (
      <HoverCardShell left={x} top={y} pointerEvents="none">
        <Flex row alignItems="center" gap="$spacing4">
          <TokenThumb src={logoUrlByTokenKey.get(content.node.tokenKey)} />
          <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
            {content.node.symbol}
          </Text>
          <Dot />
          <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
            {formatPercent(content.shareBps / BPS_PER_PERCENT, 1)}
          </Text>
        </Flex>
      </HoverCardShell>
    )
  }
  return (
    <LinkHoverCard
      key={content.link.id}
      content={content}
      logoUrlByTokenKey={logoUrlByTokenKey}
      x={x}
      y={y}
      onEnter={onEnter}
      onLeave={onLeave}
    />
  )
}

function LinkHoverCard({
  content: { link, from, to },
  logoUrlByTokenKey,
  x,
  y,
  onEnter,
  onLeave,
}: {
  content: Extract<HoverContent, { kind: 'link' }>
  logoUrlByTokenKey: ReadonlyMap<string, string>
  x: number
  y: number
  onEnter: () => void
  onLeave: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const [isCopied, copy] = useCopyClipboard(COPIED_RESET_MS)
  const poolAddress = link.poolAddress
  const copyPool = (): void => {
    if (poolAddress) {
      copy(poolAddress).catch(() => undefined)
    }
  }
  const isWrap = link.protocol === TradingApi.RouteGraphPool.protocol.WRAP
  const fee = link.isDynamicFee
    ? t('common.dynamic')
    : link.feePips !== undefined
      ? formatPercent(link.feePips / PIPS_PER_PERCENT, 4)
      : undefined
  const usd =
    link.usdIn !== undefined && link.usdOut !== undefined
      ? formatUsdInOut({ usdIn: link.usdIn, usdOut: link.usdOut, convertFiatAmountFormatted, formatPercent })
      : undefined

  return (
    <HoverCardShell left={x} top={y} width={LINK_HOVER_CARD_WIDTH} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Flex gap="$spacing4" pr={poolAddress ? '$spacing20' : undefined}>
        <Flex row alignItems="center" gap="$spacing4">
          <TokenPair sourceSrc={logoUrlByTokenKey.get(from.tokenKey)} targetSrc={logoUrlByTokenKey.get(to.tokenKey)} />
          <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
            {`${from.symbol}/${to.symbol}`}
          </Text>
          {!isWrap && fee && (
            <>
              <Dot />
              <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
                {fee}
              </Text>
            </>
          )}
          <Dot />
          <Text variant="body4" color="$neutral1" whiteSpace="nowrap">
            {link.protocol.toLowerCase()}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
            {t('swap.routing.guidestar.share', { share: formatPercent(link.shareBps / BPS_PER_PERCENT, 1) })}
          </Text>
          {usd && (
            <>
              <Dot />
              <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                {usd}
              </Text>
            </>
          )}
        </Flex>
        {link.hooks && (
          <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
            {t('liquidity.hooks.address.tooltip', { address: shortenAddress({ address: link.hooks }) })}
          </Text>
        )}
      </Flex>
      {poolAddress && (
        <TouchableArea
          position="absolute"
          right="$spacing12"
          top="$spacing12"
          accessibilityLabel={t('swap.routing.guidestar.copyPool')}
          onPress={copyPool}
        >
          {isCopied ? (
            <CheckmarkCircle size="$icon.16" color="$statusSuccess" />
          ) : (
            <CopyAlt size="$icon.16" color="$neutral2" />
          )}
        </TouchableArea>
      )}
    </HoverCardShell>
  )
}

/** e.g. "$68.0K → $67.7K (-0.394%)": the USD through the pool and what the hop cost. */
function formatUsdInOut({
  usdIn,
  usdOut,
  convertFiatAmountFormatted,
  formatPercent,
}: {
  usdIn: number
  usdOut: number
  convertFiatAmountFormatted: ReturnType<typeof useLocalizationContext>['convertFiatAmountFormatted']
  formatPercent: ReturnType<typeof useLocalizationContext>['formatPercent']
}): string {
  const slippagePercent = usdIn > 0 ? ((usdIn - usdOut) / usdIn) * 100 : 0
  const amounts = `${convertFiatAmountFormatted(usdIn, NumberType.FiatTokenStats)} → ${convertFiatAmountFormatted(usdOut, NumberType.FiatTokenStats)}`
  return `${amounts} (${formatPercent(-slippagePercent, 3)})`
}

function HoverCardShell({
  left,
  top,
  width,
  pointerEvents,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  left: number
  top: number
  width?: number
  pointerEvents?: 'none'
  children: React.ReactNode
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}): JSX.Element {
  return (
    <Flex
      position="absolute"
      zIndex="$tooltip"
      left={left}
      top={top}
      width={width ?? 'max-content'}
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface1"
      p="$spacing12"
      shadowColor="$shadowColor"
      shadowOpacity={0.1}
      shadowRadius={6}
      pointerEvents={pointerEvents}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Flex>
  )
}

function Dot(): JSX.Element {
  return <Flex width={2} height={2} shrink={false} borderRadius="$roundedFull" backgroundColor="$neutral3" />
}

function TokenThumb({ src }: { src?: string }): JSX.Element | null {
  const colors = useSporeColors()
  if (!src) {
    return null
  }
  return (
    <img
      src={src}
      alt=""
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      style={{ flexShrink: 0, borderRadius: '50%', border: `1px solid ${colors.surface1.val}` }}
    />
  )
}

/** The pool's two token logos, overlapped. */
function TokenPair({ sourceSrc, targetSrc }: { sourceSrc?: string; targetSrc?: string }): JSX.Element | null {
  if (!sourceSrc && !targetSrc) {
    return null
  }
  return (
    <Flex row alignItems="center" shrink={false}>
      <Flex zIndex={2} mr={-4}>
        <TokenThumb src={sourceSrc} />
      </Flex>
      <TokenThumb src={targetSrc} />
    </Flex>
  )
}

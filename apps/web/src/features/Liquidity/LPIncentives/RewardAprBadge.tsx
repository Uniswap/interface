import { Flex, type FlexCompatProps as FlexProps, Text } from '@universe/mycelium'
import { useColorsFromTokenColor } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { AppTFunction } from 'utilities/src/i18n/types'
import { OverlappingCurrencyLogos } from '~/components/Logo/OverlappingCurrencyLogos'
import { rewardCurrencyId, sortRewardsByBoost } from '~/features/Liquidity/LPIncentives/utils'
import { useSrcColor } from '~/hooks/useColor'

/** `delta` → "+4.50%"; `rewardApr` → "4.50% reward APR"; `symbol` → "4.50% USDG". */
type RewardAprLabel = 'delta' | 'rewardApr' | 'symbol'

interface RewardAprBadgeProps extends FlexProps {
  /**
   * One entry per reward token, in any order — the badge headlines the largest boost and counts the
   * rest, so which one leads doesn't depend on how the source serialized them. Callers holding a bare
   * APR and the token it's paid in adapt first via `toRewardAprEntries`. Empty renders nothing.
   */
  rewards: PositionRewardApr[]
  /**
   * Borrow the single reward token's own logo colour. With several tokens the badge is a headline
   * plus a "+N", so tinting it as the headline token would overstate what the colour covers; it
   * falls back to neutral, as it does when extraction finds nothing usable in the logo.
   */
  isTokenColor?: boolean
  /** `sm` is a 12px logo beside 12px text; `md` is 16px beside 14px. */
  size?: 'sm' | 'md'
  /** Drop the pill and sit inline on the surface's own background. */
  hideBackground?: boolean
  label?: RewardAprLabel
}

/**
 * The LP-incentive APR boost, as a badge. One component behind every reward-APR surface: the
 * positions table, the fee stats, the fee-tier cards, the pool header and stats, and the Explore
 * pools table.
 *
 * It never renders its own tooltip. Most callers wrap a wider region than the badge — base APR *and*
 * badge — in one `MouseoverTooltip`, so owning one here would fight them.
 */
export function RewardAprBadge({
  rewards,
  isTokenColor = false,
  size = 'md',
  hideBackground = false,
  label = 'delta',
  ...rest
}: RewardAprBadgeProps): JSX.Element | null {
  if (rewards.length === 0) {
    return null
  }

  // Extraction is a `useState`/`useEffect` machine per logo, so the tinted path is a separate
  // component rather than a hook this one calls conditionally — nothing runs it unless asked.
  return isTokenColor && rewards.length === 1 ? (
    <TokenTintedBadge reward={rewards[0]} size={size} hideBackground={hideBackground} label={label} {...rest} />
  ) : (
    // `isTokenColor` still reaches the content when the tint is dropped: it selects the compact chip
    // metrics, which are a property of the surface asking, not of whether extraction ran.
    <BadgeContent
      rewards={rewards}
      isTokenColor={isTokenColor}
      size={size}
      hideBackground={hideBackground}
      label={label}
      {...rest}
    />
  )
}

function TokenTintedBadge({
  reward,
  ...rest
}: { reward: PositionRewardApr } & Omit<RewardAprBadgeProps, 'rewards' | 'isTokenColor'>): JSX.Element {
  const currencyInfo = useCurrencyInfo(rewardCurrencyId(reward.token))
  const { tokenColor } = useSrcColor({
    src: currencyInfo?.logoUrl ?? undefined,
    currencyName: currencyInfo?.currency.name,
    colorOverrides: currencyInfo?.colorOverrides,
  })
  const { validTokenColor, lightTokenColor } = useColorsFromTokenColor(tokenColor ?? undefined)

  return (
    <BadgeContent
      rewards={[reward]}
      isTokenColor
      tintFill={lightTokenColor ?? undefined}
      tintText={validTokenColor ?? undefined}
      {...rest}
    />
  )
}

function BadgeContent({
  rewards,
  isTokenColor = false,
  size = 'md',
  hideBackground = false,
  label = 'delta',
  tintFill,
  tintText,
  ...rest
}: RewardAprBadgeProps & { tintFill?: string; tintText?: string }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  // Largest boost, not first served: `sortRewardsByBoost` explains why the served order can't pick.
  const [headlineReward] = sortRewardsByBoost(rewards)
  const isMultiToken = rewards.length > 1
  // Resolved for the logo, and for the symbol: a served reward token need not carry one, and every
  // surface that names the token falls back this way.
  const headlineCurrencyInfo = useCurrencyInfo(rewardCurrencyId(headlineReward.token))
  // Only the headline token gets a logo, so the one beside the symbol is always that symbol's — a
  // cluster of every reward token would slide a different one up there whenever the headline is
  // unlisted.
  const headlineLogos = headlineCurrencyInfo ? [headlineCurrencyInfo] : []
  // The headline token's own boost, not the sum across tokens: a badge has room for one figure and
  // one symbol, and a sum labelled with one token's symbol reads as that token paying all of it.
  // PoolAprTooltip carries the total, itemised per token, which is what makes the total legible.
  const formattedApr = formatPercent(headlineReward.boostedPoolApr)
  const symbol = headlineReward.token.symbol ?? headlineCurrencyInfo?.currency.symbol

  const metrics = badgeMetrics({ isTokenColor, size, hideBackground })

  return (
    <Flex
      row
      width="fit-content"
      alignItems="center"
      gap={metrics.gap}
      px={metrics.px}
      py={metrics.py}
      borderRadius={hideBackground ? undefined : '$rounded6'}
      backgroundColor={hideBackground ? undefined : (tintFill ?? '$surface3')}
      {...rest}
    >
      {/* The reward token's chain belongs to the campaign, not to the pool the badge sits on. */}
      {isMultiToken ? (
        // Only the headline token goes to the cluster, so the logo beside the name is always that
        // name's — the rest are a "+N" count. Passing every token instead would drop any that fail
        // to resolve and slide a different token's logo up next to the headline symbol.
        <OverlappingCurrencyLogos
          currencyInfos={headlineLogos}
          size={logoSize(size)}
          // Logos shown plus the tokens the badge doesn't name, which is what "+N" has to count. A
          // flat `rewards.length` breaks when the headline is unlisted and renders no logo: the
          // cluster's `totalCount - shown.length` then folds the headline into the overflow and
          // reads "+2" on a two-token badge, right beside the symbol it just named.
          totalCount={headlineLogos.length + rewards.length - 1}
        />
      ) : (
        <CurrencyLogo currencyInfo={headlineCurrencyInfo} size={logoSize(size)} hideNetworkLogo />
      )}
      <Text variant={metrics.textVariant} color={tintText ?? '$neutral2'}>
        {formatLabel({ label, formattedApr, symbol, t })}
      </Text>
    </Flex>
  )
}

/**
 * The per-family metrics, kept as a lookup rather than collapsed: these reproduce what each surface
 * renders today, so the consolidation moves no pixels. The tinted chips sit tighter and carry
 * button-label weight; every other surface is roomier and body weight.
 *
 * Worth collapsing once a designer signs off — the split is recorded here, not resolved.
 */
function badgeMetrics({
  isTokenColor,
  size,
  hideBackground,
}: {
  isTokenColor: boolean
  size: 'sm' | 'md'
  hideBackground: boolean
}): Pick<FlexProps, 'gap' | 'px' | 'py'> & { textVariant: 'buttonLabel4' | 'body4' | 'body3' } {
  return {
    gap: isTokenColor ? '$spacing4' : '$spacing6',
    px: hideBackground ? undefined : isTokenColor ? '$spacing4' : '$spacing6',
    py: hideBackground || !isTokenColor ? undefined : '$spacing2',
    textVariant: !hideBackground && isTokenColor ? 'buttonLabel4' : size === 'sm' ? 'body4' : 'body3',
  }
}

function logoSize(size: 'sm' | 'md'): number {
  return size === 'sm' ? 12 : 16
}

function formatLabel({
  label,
  formattedApr,
  symbol,
  t,
}: {
  label: RewardAprLabel
  formattedApr: string
  symbol?: string
  t: AppTFunction
}): string {
  if (label === 'rewardApr') {
    return t('pool.rewardAPR.percent', { pct: formattedApr })
  }
  if (label === 'symbol') {
    return symbol ? `${formattedApr} ${symbol}` : formattedApr
  }
  return `+${formattedApr}`
}

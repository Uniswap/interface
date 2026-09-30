import { Flex } from '@universe/mycelium'
import { AdaptiveWebPopoverContentCompat, PopoverCompat } from '@universe/mycelium/popover-compat'
import { useMedia, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { ReactNode, useMemo } from 'react'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import {
  BalanceBreakdownRow,
  type BalanceBreakdownRowData,
} from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownRow'

const POPOVER_WIDTH = 208

interface BalanceBreakdownPopoverProps {
  tokens: PortfolioTotalValue | undefined
  pools: PortfolioTotalValue | undefined
  earn: PortfolioTotalValue | undefined
  /** Period percent change per category, derived from the chart series for the selected period. */
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  earnPercentChange: number | undefined
  children: ReactNode
  /** When true, render the trigger without the popover (e.g. while viewing a single category). */
  disabled?: boolean
}

/**
 * Builds the popover row list in fixed category order (tokens → earn → pools), keeping only the
 * categories with a positive balance. Returns [] unless at least two categories qualify, since a
 * single-category wallet has no meaningful split to show.
 */
export function buildBalanceBreakdownRows({
  tokens,
  pools,
  earn,
  tokensPercentChange,
  poolsPercentChange,
  earnPercentChange,
}: {
  tokens: PortfolioTotalValue | undefined
  pools: PortfolioTotalValue | undefined
  earn: PortfolioTotalValue | undefined
  tokensPercentChange: number | undefined
  poolsPercentChange: number | undefined
  earnPercentChange: number | undefined
}): readonly BalanceBreakdownRowData[] {
  // Value stays the current balance; percent comes from the chart period (matching the header).
  const orderedCandidates: { value: PortfolioTotalValue | undefined; row: BalanceBreakdownRowData }[] = [
    { value: tokens, row: { kind: 'tokens', valueUSD: tokens?.balanceUSD ?? 0, percentChange: tokensPercentChange } },
    { value: earn, row: { kind: 'earn', valueUSD: earn?.balanceUSD ?? 0, percentChange: earnPercentChange } },
    { value: pools, row: { kind: 'pools', valueUSD: pools?.balanceUSD ?? 0, percentChange: poolsPercentChange } },
  ]
  const rows = orderedCandidates.filter(({ value }) => hasPositiveBalanceUSD(value)).map(({ row }) => row)
  return rows.length >= 2 ? rows : []
}

function hasPositiveBalanceUSD(
  value: PortfolioTotalValue | undefined,
): value is PortfolioTotalValue & { balanceUSD: number } {
  return value?.balanceUSD !== undefined && value.balanceUSD > 0
}

/**
 * Popover anchored to the Portfolio Overview total balance, showing the tokens / earn / pools
 * composition split. Renders whenever at least two categories have a positive USD value: hover-to-open
 * on desktop and tap-to-open on mweb (hover is disabled on the mobile breakpoint so the trigger responds to taps).
 */
export function BalanceBreakdownPopover({
  tokens,
  pools,
  earn,
  tokensPercentChange,
  poolsPercentChange,
  earnPercentChange,
  children,
  disabled,
}: BalanceBreakdownPopoverProps): JSX.Element {
  const media = useMedia()
  const shadowProps = useShadowPropsMedium()

  const orderedRows = useMemo(
    () =>
      buildBalanceBreakdownRows({ tokens, pools, earn, tokensPercentChange, poolsPercentChange, earnPercentChange }),
    [tokens, pools, earn, tokensPercentChange, poolsPercentChange, earnPercentChange],
  )

  if (disabled || orderedRows.length === 0) {
    return <>{children}</>
  }

  const isMobile = media.md

  return (
    <PopoverCompat
      hoverable={isMobile ? false : { delay: { open: 200 }, restMs: 100 }}
      placement="bottom-start"
      stayInFrame
      allowFlip
      offset={{ mainAxis: 8 }}
    >
      <PopoverCompat.Trigger>
        <Flex cursor="default" testID={TestID.BalanceBreakdownPopover}>
          {children}
        </Flex>
      </PopoverCompat.Trigger>
      <AdaptiveWebPopoverContentCompat
        isOpen
        adaptWhen={false}
        role="tooltip"
        trapFocus={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={false}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        animation="quick"
        animateOnly={['transform', 'opacity']}
        p="$spacing16"
        {...(isMobile ? { width: POPOVER_WIDTH } : { minWidth: POPOVER_WIDTH })}
        {...shadowProps}
      >
        <Flex gap="$spacing8" width="100%">
          {orderedRows.map((row) => (
            <BalanceBreakdownRow key={row.kind} {...row} />
          ))}
        </Flex>
      </AdaptiveWebPopoverContentCompat>
    </PopoverCompat>
  )
}

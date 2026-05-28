import { ReactNode, useMemo } from 'react'
import { AdaptiveWebPopoverContent, Flex, Popover, useIsTouchDevice, useShadowPropsMedium } from 'ui/src'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  BalanceBreakdownRow,
  type BalanceBreakdownRowData,
} from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownRow'

const POPOVER_WIDTH = 208

interface BalanceBreakdownPopoverProps {
  tokens: PortfolioTotalValue | undefined
  pools: PortfolioTotalValue | undefined
  children: ReactNode
}

/** Builds the row list for the popover, sorted by USD value descending. */
export function buildBalanceBreakdownRows({
  tokens,
  pools,
}: {
  tokens: PortfolioTotalValue | undefined
  pools: PortfolioTotalValue | undefined
}): readonly BalanceBreakdownRowData[] {
  if (!hasPositiveBalanceUSD(tokens) || !hasPositiveBalanceUSD(pools)) {
    return []
  }
  const rows: BalanceBreakdownRowData[] = [
    { kind: 'tokens', valueUSD: tokens.balanceUSD, percentChange1d: tokens.percentChange },
    { kind: 'pools', valueUSD: pools.balanceUSD, percentChange1d: pools.percentChange },
  ]
  return rows.sort((a, b) => b.valueUSD - a.valueUSD)
}

function hasPositiveBalanceUSD(
  value: PortfolioTotalValue | undefined,
): value is PortfolioTotalValue & { balanceUSD: number } {
  return value?.balanceUSD !== undefined && value.balanceUSD > 0
}

/**
 * Hover popover anchored to the Portfolio Overview total balance, showing the token vs pool
 * composition split. Renders only on non-touch devices when both sides have a positive USD value.
 */
export function BalanceBreakdownPopover({ tokens, pools, children }: BalanceBreakdownPopoverProps): JSX.Element {
  const isTouchDevice = useIsTouchDevice()
  const shadowProps = useShadowPropsMedium()

  const orderedRows = useMemo(() => buildBalanceBreakdownRows({ tokens, pools }), [tokens, pools])

  if (orderedRows.length === 0 || isTouchDevice) {
    return <>{children}</>
  }

  return (
    <Popover
      hoverable={{ delay: { open: 200 }, restMs: 100 }}
      placement="bottom-start"
      stayInFrame
      allowFlip
      offset={{ mainAxis: 8 }}
    >
      <Popover.Trigger>
        <Flex cursor="default" testID={TestID.BalanceBreakdownPopover}>
          {children}
        </Flex>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        isOpen
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        animation="quick"
        animateOnly={['transform', 'opacity']}
        p="$spacing16"
        width={POPOVER_WIDTH}
        {...shadowProps}
      >
        <Flex gap="$spacing8" width="100%">
          {orderedRows.map((row) => (
            <BalanceBreakdownRow key={row.kind} {...row} />
          ))}
        </Flex>
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}

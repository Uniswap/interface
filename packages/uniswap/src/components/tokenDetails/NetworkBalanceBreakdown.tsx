import { SharedEventName } from '@uniswap/analytics-events'
import { isMobileApp } from '@universe/environment'
import { useCallback, useMemo } from 'react'
import { Flex, HeightAnimator, Separator, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { NetworkBalanceRow } from 'uniswap/src/components/tokenDetails/NetworkBalanceRow'
import { sortBalancesByValue } from 'uniswap/src/components/tokenDetails/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface NetworkBalanceBreakdownProps {
  balances: PortfolioBalance[]
  label: string
  expanded: boolean
  onExpandedChange?: (expanded: boolean) => void
  collapsible?: boolean
  onSelectBalance?: (balance: PortfolioBalance) => void
}

export function NetworkBalanceBreakdown({
  balances,
  label,
  expanded,
  onExpandedChange,
  collapsible = true,
  onSelectBalance,
}: NetworkBalanceBreakdownProps): JSX.Element | null {
  const trace = useTrace()
  const sortedBalances = useMemo(() => sortBalancesByValue(balances), [balances])
  const chainIds = useMemo(() => sortedBalances.map((b) => b.currencyInfo.currency.chainId), [sortedBalances])
  const isExpanded = collapsible ? expanded : true
  const chevronSize = isMobileApp ? '$icon.20' : '$icon.16'

  const onHeaderPress = useCallback(() => {
    if (!collapsible || !onExpandedChange) {
      return
    }
    const nextExpanded = !expanded
    onExpandedChange(nextExpanded)
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.BreakdownExpanded,
      balanceToggleState: nextExpanded ? 'open' : 'close',
    })
  }, [collapsible, expanded, onExpandedChange, trace])

  if (!sortedBalances.length) {
    return null
  }

  return (
    <Flex>
      {collapsible && <Separator mb="$spacing12" />}
      {collapsible ? (
        <Flex pb="$spacing8">
          <TouchableArea row justifyContent="space-between" alignItems="center" onPress={onHeaderPress}>
            <Text variant={isMobileApp ? 'body2' : 'body3'} color="$neutral2">
              {label}
            </Text>
            <Flex row alignItems="center" gap="$spacing8">
              {!isExpanded && <NetworkIconList showNumberBadge chainIds={chainIds} size={16} />}
              {isExpanded ? (
                <ChevronsIn color="$neutral2" size={chevronSize} />
              ) : (
                <ChevronsOut color="$neutral2" size={chevronSize} />
              )}
            </Flex>
          </TouchableArea>
        </Flex>
      ) : (
        <Text variant="subheading1" color="$neutral1">
          {label}
        </Text>
      )}
      <HeightAnimator open={!collapsible || isExpanded}>
        {(!collapsible || isExpanded) &&
          sortedBalances.map(
            (balance): JSX.Element => (
              <NetworkBalanceRow
                key={balance.id}
                balance={balance}
                onPress={onSelectBalance ? () => onSelectBalance(balance) : undefined}
              />
            ),
          )}
      </HeightAnimator>
    </Flex>
  )
}

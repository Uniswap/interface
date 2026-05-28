import { SharedEventName } from '@uniswap/analytics-events'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenBalanceHeader } from 'src/components/TokenDetails/TokenBalanceHeader'
import { Flex, Separator } from 'ui/src'
import { NetworkBalanceBreakdown } from 'uniswap/src/components/tokenDetails/NetworkBalanceBreakdown'
import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AccountType } from 'uniswap/src/features/accounts/types'
import type { DataApiOutageProps } from 'uniswap/src/features/dataApi/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccount, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function MultichainTokenBalances({
  currentChainBalance,
  otherChainBalances,
  isOutage,
  dataUpdatedAt,
}: {
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} & DataApiOutageProps): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const displayName = useDisplayName(activeAccount?.address, { includeUnitagSuffix: true })?.name
  const isReadonly = activeAccount?.type === AccountType.Readonly
  const trace = useTrace()
  const { navigateToSwapFlow } = useWalletNavigation()

  const allBalances = useMemo(() => {
    const balances: PortfolioBalance[] = []
    if (currentChainBalance) {
      balances.push(currentChainBalance)
    }
    if (otherChainBalances) {
      balances.push(...otherChainBalances)
    }
    return balances
  }, [currentChainBalance, otherChainBalances])

  const aggregateBalance = useMemo(
    () => computeAggregateBalance(allBalances, currentChainBalance?.currencyInfo),
    [allBalances, currentChainBalance?.currencyInfo],
  )

  const hasMultipleChains = allBalances.length > 1
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true)

  const handleSelectBalance = useEvent((balance: PortfolioBalance) => {
    const { currency } = balance.currencyInfo
    const chainId = currency.chainId
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.NetworkBalanceRow,
      chain_id: chainId,
    })
    const currencyAddress = currency.isToken ? currency.address : getNativeAddress(chainId)
    navigateToSwapFlow({
      currencyField: CurrencyField.OUTPUT,
      currencyAddress,
      currencyChainId: chainId,
    })
  })

  return (
    <Flex borderRadius="$rounded8" gap="$spacing12">
      {aggregateBalance && (
        <Flex gap="$spacing24">
          <Separator />
          <TokenBalanceHeader
            balance={aggregateBalance}
            displayName={displayName}
            isReadonly={isReadonly}
            isOutage={isOutage}
            dataUpdatedAt={dataUpdatedAt}
          />
        </Flex>
      )}
      {hasMultipleChains && (
        <NetworkBalanceBreakdown
          balances={allBalances}
          label={t('tdp.balanceSummary.breakdown')}
          expanded={isBreakdownExpanded}
          onExpandedChange={setIsBreakdownExpanded}
          onSelectBalance={isReadonly ? undefined : handleSelectBalance}
        />
      )}
    </Flex>
  )
}

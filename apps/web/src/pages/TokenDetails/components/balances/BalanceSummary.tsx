import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { NetworkBalanceBreakdown } from 'uniswap/src/components/tokenDetails/NetworkBalanceBreakdown'
import { computeAggregateBalance } from 'uniswap/src/components/tokenDetails/utils'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { Balance } from '~/pages/TokenDetails/components/balances/Balance'
import { BridgedAssetWithdrawButton } from '~/pages/TokenDetails/components/balances/BridgedAssetWithdrawButton'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'

export function BalanceSummary(): JSX.Element | null {
  const { isDisconnected } = useConnectionStatus()
  const { currencyChain, multiChainMap, balanceError, tokenQuery } = useTDPStore((s) => ({
    currencyChain: s.currencyChain,
    multiChainMap: s.multiChainMap,
    balanceError: s.balanceError,
    tokenQuery: s.tokenQuery,
  }))
  const effectiveCurrency = useTDPEffectiveCurrency()
  const metadata = useTokenMetadata(currencyId(effectiveCurrency), { legacyToken: tokenQuery.data?.token })

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  const allBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (value.balance !== undefined) {
      allBalances.push(value.balance)
      if (key !== currencyChain) {
        otherChainBalances.push(value.balance)
      }
    }
  }

  const isMultichainBalance = otherChainBalances.length > 0

  const displayBalance = isMultichainBalance
    ? computeAggregateBalance(allBalances, pageChainBalance?.currencyInfo)
    : pageChainBalance

  const hasBalances = Boolean(displayBalance || isMultichainBalance)
  const isOutage = !!balanceError

  if (isDisconnected || !hasBalances) {
    return null
  }
  const projectName = metadata.name ?? undefined

  return (
    <Flex gap="$gap24" height="fit-content" width="100%">
      <Flex gap="$gap16">
        <PageChainBalanceSummary
          pageChainBalance={displayBalance}
          isMultichainBalance={isMultichainBalance}
          isOutage={isOutage}
          projectName={projectName}
        />
        {isMultichainBalance && (
          <BreakdownSection
            otherChainBalances={otherChainBalances}
            pageChainBalance={pageChainBalance}
            hasPageChainBalance={!!pageChainBalance}
          />
        )}
      </Flex>
      <BridgedAssetWithdrawButton />
    </Flex>
  )
}

function PageChainBalanceSummary({
  pageChainBalance,
  isMultichainBalance = false,
  isOutage = false,
  projectName,
}: {
  pageChainBalance?: PortfolioBalance
  isMultichainBalance?: boolean
  isOutage?: boolean
  projectName?: string
}): JSX.Element | null {
  const { t } = useTranslation()
  if (!pageChainBalance) {
    // During an outage with no cached data, the page-level outage banner handles the messaging
    return null
  }
  const currency = pageChainBalance.currencyInfo.currency
  return (
    <Flex height="fit-content" width="100%" gap="$gap16">
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="subheading2" color="$neutral2">
          {t('tdp.balanceSummary.title')}
        </Text>
        {isOutage && (
          <MouseoverTooltip text={t('dataApi.outage.modal.description')} placement="top" size={TooltipSize.Small}>
            <AlertTriangleFilled size="$icon.16" />
          </MouseoverTooltip>
        )}
      </Flex>
      <Balance
        currency={currency}
        fetchedBalance={pageChainBalance}
        isAggregate={isMultichainBalance}
        isMultichainBalance={isMultichainBalance}
        projectName={projectName}
      />
    </Flex>
  )
}

function BreakdownSection({
  otherChainBalances,
  pageChainBalance,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioBalance[]
  pageChainBalance?: PortfolioBalance
  hasPageChainBalance: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const trace = useTrace()
  const { setSelectedMultichainChainId } = useTDPSelectedMultichainChain()
  const { defaultChainId } = useEnabledChains()

  const displayBalances = useMemo(
    () => [...(pageChainBalance ? [pageChainBalance] : []), ...otherChainBalances],
    [pageChainBalance, otherChainBalances],
  )

  const handleSelectBalance = useCallback(
    (balance: PortfolioBalance) => {
      const currency = balance.currencyInfo.currency
      const chainId = currency.chainId || defaultChainId
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.NetworkBalanceRow,
        chain_id: chainId,
      })
      setSelectedMultichainChainId(chainId)
    },
    [defaultChainId, setSelectedMultichainChainId, trace],
  )

  const collapseLabel = t('tdp.balanceSummary.breakdown')

  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true)

  if (!displayBalances.length) {
    return null
  }

  return (
    <NetworkBalanceBreakdown
      balances={displayBalances}
      label={collapseLabel}
      expanded={hasPageChainBalance ? isBreakdownExpanded : true}
      onExpandedChange={hasPageChainBalance ? setIsBreakdownExpanded : undefined}
      collapsible={hasPageChainBalance}
      onSelectBalance={handleSelectBalance}
    />
  )
}

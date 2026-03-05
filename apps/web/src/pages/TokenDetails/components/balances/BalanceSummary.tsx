import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, HeightAnimator, Separator, Text } from 'ui/src'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { PortfolioExpandoRow } from '~/pages/Portfolio/components/PortfolioExpandoRow'
import { Balance } from '~/pages/TokenDetails/components/balances/Balance'
import { BridgedAssetWithdrawButton } from '~/pages/TokenDetails/components/balances/BridgedAssetWithdrawButton'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export function BalanceSummary(): JSX.Element | null {
  const { isDisconnected } = useConnectionStatus()
  const { currencyChain, multiChainMap } = useTDPContext()

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== currencyChain && value.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  otherChainBalances.sort((a, b) => {
    const aQty = Number(a.quantity)
    const bQty = Number(b.quantity)
    return bQty - aQty
  })
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (isDisconnected || !hasBalances) {
    return null
  }
  return (
    <Flex gap="$gap24" height="fit-content" width="100%">
      <Flex gap="$gap16">
        <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
        <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
      </Flex>
      <BridgedAssetWithdrawButton />
    </Flex>
  )
}

export function PageChainBalanceSummary({
  pageChainBalance,
}: {
  pageChainBalance?: PortfolioBalance
}): JSX.Element | null {
  const { t } = useTranslation()
  if (!pageChainBalance) {
    return null
  }
  const currency = pageChainBalance.currencyInfo.currency
  return (
    <Flex height="fit-content" width="100%" gap="$gap16">
      <Text variant="subheading2" color="$neutral2">
        {t('tdp.balanceSummary.title')}
      </Text>
      <Balance currency={currency} chainId={currency.chainId} fetchedBalance={pageChainBalance} isAggregate />
    </Flex>
  )
}

function OtherChainsBalanceSummary({
  otherChainBalances,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioBalance[]
  hasPageChainBalance: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()
  const [isExpanded, setIsExpanded] = useState(true)

  if (!otherChainBalances.length) {
    return null
  }

  const isCollapsible = hasPageChainBalance

  return (
    <Flex>
      {isCollapsible && <Separator mb="$spacing12" />}
      {isCollapsible ? (
        <Flex pb="$spacing8">
          <PortfolioExpandoRow
            isExpanded={isExpanded}
            label={t('tdp.balanceSummary.breakdown')}
            onPress={() => setIsExpanded(!isExpanded)}
            iconAlignRight
            textVariant="body3"
            iconSize="$icon.16"
            p="$none"
          />
        </Flex>
      ) : (
        <Text variant="subheading1" color="$neutral1">
          {t('tdp.balanceSummary.breakdown')}
        </Text>
      )}
      <HeightAnimator open={!isCollapsible || isExpanded}>
        {(!isCollapsible || isExpanded) &&
          otherChainBalances.map((balance) => {
            const currency = balance.currencyInfo.currency
            const chainId = currency.chainId || defaultChainId
            return (
              <Balance
                key={balance.id}
                currency={currency}
                chainId={chainId}
                fetchedBalance={balance}
                showChainLogoOnly
                onClick={() =>
                  navigate(
                    getTokenDetailsURL({
                      address: currency.isToken ? currency.address : undefined,
                      chain: toGraphQLChain(chainId),
                    }),
                  )
                }
              />
            )
          })}
      </HeightAnimator>
    </Flex>
  )
}

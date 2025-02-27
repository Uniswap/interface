import { Currency } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { PortfolioBalance } from 'graphql/data/portfolios'
import { getTokenDetailsURL, gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { breakpoints } from 'ui/src/theme'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const BalancesCard = styled.div`
  color: ${({ theme }) => theme.neutral1};
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
  width: 100%;

  @media screen and (min-width: ${breakpoints.lg}px) {
    display: flex;
  }
`
const BalanceSection = styled.div`
  height: fit-content;
  width: 100%;
`
const BalanceRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  margin-top: 12px;
`
const BalanceItem = styled.div`
  display: flex;
  align-items: center;
`

const BalanceAmountsContainer = styled.div<{ $alignLeft: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-left: 12px;
  ${({ $alignLeft }) =>
    $alignLeft &&
    `
    justify-content: start;
    gap: 8px;
  `}
`

interface BalanceProps {
  currency?: Currency
  chainId?: UniverseChainId
  gqlBalance?: PortfolioBalance
  alignLeft?: boolean
  onClick?: () => void
}
const Balance = ({
  currency,
  chainId = UniverseChainId.Mainnet,
  gqlBalance,
  alignLeft = false,
  onClick,
}: BalanceProps) => {
  const { formatNumber } = useFormatter()
  const currencies = useMemo(() => [currency], [currency])

  const formattedGqlBalance = formatNumber({
    input: gqlBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdGqlValue = formatNumber({
    input: gqlBalance?.denominatedValue?.value,
    type: NumberType.PortfolioBalance,
  })

  return (
    <BalanceRow onClick={onClick}>
      <PortfolioLogo
        currencies={currencies}
        chainId={chainId}
        images={[gqlBalance?.token?.project?.logoUrl]}
        size={32}
      />
      <BalanceAmountsContainer $alignLeft={alignLeft}>
        <BalanceItem>
          <ThemedText.BodyPrimary>{formattedUsdGqlValue}</ThemedText.BodyPrimary>
        </BalanceItem>
        <BalanceItem>
          <ThemedText.BodySecondary>{formattedGqlBalance}</ThemedText.BodySecondary>
        </BalanceItem>
      </BalanceAmountsContainer>
    </BalanceRow>
  )
}

export const PageChainBalanceSummary = ({
  pageChainBalance,
  alignLeft = false,
}: {
  pageChainBalance?: PortfolioBalance
  alignLeft?: boolean
}) => {
  if (!pageChainBalance || !pageChainBalance.token) {
    return null
  }
  const currency = gqlToCurrency(pageChainBalance.token)
  return (
    <BalanceSection>
      <ThemedText.HeadlineSmall color="neutral1">
        <Trans i18nKey="tdp.balanceSummary.title" />
      </ThemedText.HeadlineSmall>
      <Balance currency={currency} chainId={currency?.chainId} gqlBalance={pageChainBalance} alignLeft={alignLeft} />
    </BalanceSection>
  )
}

const OtherChainsBalanceSummary = ({
  otherChainBalances,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioBalance[]
  hasPageChainBalance: boolean
}) => {
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()

  if (!otherChainBalances.length) {
    return null
  }
  return (
    <BalanceSection>
      {hasPageChainBalance ? (
        <ThemedText.SubHeaderSmall>
          <Trans i18nKey="tdp.balanceSummary.otherNetworks">On other networks</Trans>
        </ThemedText.SubHeaderSmall>
      ) : (
        <ThemedText.HeadlineSmall>
          <Trans i18nKey="tdp.balanceSummary.otherNetworksBalance">Balance on other networks</Trans>
        </ThemedText.HeadlineSmall>
      )}
      {otherChainBalances.map((balance) => {
        const currency = balance.token && gqlToCurrency(balance.token)
        const chainId = (balance.token && supportedChainIdFromGQLChain(balance.token.chain)) ?? defaultChainId
        return (
          <Balance
            key={balance.id}
            currency={currency}
            chainId={chainId}
            gqlBalance={balance}
            onClick={() =>
              navigate(
                getTokenDetailsURL({
                  address: balance.token?.address,
                  chain: balance.token?.chain ?? Chain.Ethereum,
                }),
              )
            }
          />
        )
      })}
    </BalanceSection>
  )
}

export default function BalanceSummary() {
  const account = useAccount()
  const { currencyChain, multiChainMap } = useTDPContext()

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== currencyChain && value?.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (!account.isConnected || !hasBalances) {
    return null
  }
  return (
    <BalancesCard>
      <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
      <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
    </BalancesCard>
  )
}

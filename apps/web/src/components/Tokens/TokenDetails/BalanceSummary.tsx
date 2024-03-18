import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Chain, PortfolioTokenBalancePartsFragment } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL, gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { useTDPContext } from 'pages/TokenDetails/TDPContext'

const BalancesCard = styled.div`
  color: ${({ theme }) => theme.neutral1};
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
  width: 100%;

  // 768 hardcoded to match NFT-redesign navbar breakpoints
  // src/nft/css/sprinkles.css.ts
  // change to match theme breakpoints when this navbar is updated
  @media screen and (min-width: 768px) {
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

const BalanceAmountsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-left: 12px;
`

interface BalanceProps {
  currency?: Currency
  chainId?: ChainId
  gqlBalance?: PortfolioTokenBalancePartsFragment
  onClick?: () => void
}
const Balance = ({ currency, chainId = ChainId.MAINNET, gqlBalance, onClick }: BalanceProps) => {
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
        images={[gqlBalance?.tokenProjectMarket?.tokenProject.logoUrl]}
        size="2rem"
      />
      <BalanceAmountsContainer>
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

const PageChainBalanceSummary = ({ pageChainBalance }: { pageChainBalance?: PortfolioTokenBalancePartsFragment }) => {
  if (!pageChainBalance || !pageChainBalance.token) return null
  const currency = gqlToCurrency(pageChainBalance.token)
  return (
    <BalanceSection>
      <ThemedText.HeadlineSmall color="neutral1">
        <Trans>Your balance</Trans>
      </ThemedText.HeadlineSmall>
      <Balance currency={currency} chainId={currency?.chainId} gqlBalance={pageChainBalance} />
    </BalanceSection>
  )
}

const OtherChainsBalanceSummary = ({
  otherChainBalances,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioTokenBalancePartsFragment[]
  hasPageChainBalance: boolean
}) => {
  const navigate = useNavigate()

  if (!otherChainBalances.length) return null
  return (
    <BalanceSection>
      {hasPageChainBalance ? (
        <ThemedText.SubHeaderSmall>
          <Trans>On other networks</Trans>
        </ThemedText.SubHeaderSmall>
      ) : (
        <ThemedText.HeadlineSmall>
          <Trans>Balance on other networks</Trans>
        </ThemedText.HeadlineSmall>
      )}
      {otherChainBalances.map((balance) => {
        const currency = balance.token && gqlToCurrency(balance.token)
        const chainId = (balance.token && supportedChainIdFromGQLChain(balance.token.chain)) ?? ChainId.MAINNET
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
                })
              )
            }
          />
        )
      })}
    </BalanceSection>
  )
}

export default function BalanceSummary() {
  const { account } = useWeb3React()
  const { currencyChain, multiChainMap } = useTDPContext()

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioTokenBalancePartsFragment[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== currencyChain && value?.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (!account || !hasBalances) {
    return null
  }
  return (
    <BalancesCard>
      <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
      <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
    </BalancesCard>
  )
}

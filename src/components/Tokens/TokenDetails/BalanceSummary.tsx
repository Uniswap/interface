import { Trans } from '@lingui/macro'
import { ChainId, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain } from 'constants/chains'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { Chain, PortfolioTokenBalancePartsFragment } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL, gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { MultiChainMap } from '.'

const BalancesCard = styled.div<{ isInfoTDPEnabled?: boolean }>`
  color: ${({ theme }) => theme.neutral1};
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
  ${({ isInfoTDPEnabled }) => !isInfoTDPEnabled && 'padding: 16px;'}
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

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 8px;
  flex: 1;
`

const BalanceAmountsContainer = styled.div<{ isInfoTDPEnabled?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  ${({ isInfoTDPEnabled }) => isInfoTDPEnabled && 'margin-left: 12px;'}
`

const StyledNetworkLabel = styled.div`
  color: ${({ color }) => color};
  font-size: 12px;
  line-height: 16px;
`

interface BalanceProps {
  currency?: Currency
  chainId?: ChainId
  balance?: CurrencyAmount<Currency> // TODO(WEB-3026): only used for pre-Info-project calculations, should remove after project goes live
  gqlBalance?: PortfolioTokenBalancePartsFragment
  onClick?: () => void
}
const Balance = ({ currency, chainId = ChainId.MAINNET, balance, gqlBalance, onClick }: BalanceProps) => {
  const { formatCurrencyAmount, formatNumber } = useFormatter()
  const { label: chainName, color } = getChainInfo(asSupportedChain(chainId) ?? ChainId.MAINNET)
  const currencies = useMemo(() => [currency], [currency])
  const isInfoTDPEnabled = useInfoExplorePageEnabled()

  const formattedBalance = formatCurrencyAmount({
    amount: balance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(balance),
    type: NumberType.PortfolioBalance,
  })
  const formattedGqlBalance = formatNumber({
    input: gqlBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdGqlValue = formatNumber({
    input: gqlBalance?.denominatedValue?.value,
    type: NumberType.PortfolioBalance,
  })

  if (isInfoTDPEnabled) {
    return (
      <BalanceRow onClick={onClick}>
        <PortfolioLogo currencies={currencies} chainId={chainId} size="2rem" />
        <BalanceAmountsContainer isInfoTDPEnabled>
          <BalanceItem>
            <ThemedText.BodyPrimary>{formattedUsdGqlValue}</ThemedText.BodyPrimary>
          </BalanceItem>
          <BalanceItem>
            <ThemedText.BodySecondary>{formattedGqlBalance}</ThemedText.BodySecondary>
          </BalanceItem>
        </BalanceAmountsContainer>
      </BalanceRow>
    )
  } else {
    return (
      <BalanceRow>
        <PortfolioLogo currencies={currencies} chainId={chainId} size="2rem" />
        <BalanceContainer>
          <BalanceAmountsContainer>
            <BalanceItem>
              <ThemedText.SubHeader>
                {formattedBalance} {currency?.symbol}
              </ThemedText.SubHeader>
            </BalanceItem>
            <BalanceItem>
              <ThemedText.BodyPrimary>{formattedUsdValue}</ThemedText.BodyPrimary>
            </BalanceItem>
          </BalanceAmountsContainer>
          <StyledNetworkLabel color={color}>{chainName}</StyledNetworkLabel>
        </BalanceContainer>
      </BalanceRow>
    )
  }
}

const ConnectedChainBalanceSummary = ({
  connectedChainBalance,
}: {
  connectedChainBalance?: CurrencyAmount<Currency>
}) => {
  const { chainId: connectedChainId } = useWeb3React()
  if (!connectedChainId || !connectedChainBalance || !connectedChainBalance.greaterThan(0)) return null
  const token = connectedChainBalance.currency
  const { label: chainName } = getChainInfo(asSupportedChain(connectedChainId) ?? ChainId.MAINNET)
  return (
    <BalanceSection>
      <ThemedText.SubHeaderSmall color="neutral1">
        <Trans>Your balance on {chainName}</Trans>
      </ThemedText.SubHeaderSmall>
      <Balance currency={token} chainId={connectedChainId} balance={connectedChainBalance} />
    </BalanceSection>
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
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

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
                  isInfoExplorePageEnabled,
                })
              )
            }
          />
        )
      })}
    </BalanceSection>
  )
}

export default function BalanceSummary({
  currency,
  chain,
  multiChainMap,
}: {
  currency: Currency
  chain: Chain
  multiChainMap: MultiChainMap
}) {
  const { account } = useWeb3React()

  const isInfoTDPEnabled = useInfoTDPEnabled()

  const connectedChainBalance = useCurrencyBalance(account, currency)

  const pageChainBalance = multiChainMap[chain].balance
  const otherChainBalances: PortfolioTokenBalancePartsFragment[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== chain && value.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (!account || !hasBalances) {
    return null
  }
  return (
    <BalancesCard isInfoTDPEnabled={isInfoTDPEnabled}>
      {!isInfoTDPEnabled && <ConnectedChainBalanceSummary connectedChainBalance={connectedChainBalance} />}
      {isInfoTDPEnabled && (
        <>
          <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
          <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
        </>
      )}
    </BalancesCard>
  )
}

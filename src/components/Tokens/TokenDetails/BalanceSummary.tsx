import { Trans } from '@lingui/macro'
import { ChainId, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain } from 'constants/chains'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenBalance } from 'graphql/data/__generated__/types-and-hooks'
import { gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
  token?: Currency
  chainId: ChainId
  balance?: CurrencyAmount<Currency> // TODO(WEB-3026): only used for pre-Info-project calculations, should remove after project goes live
  gqlBalance?: TokenBalance
  tokenSymbol?: string
  color?: string
  chainName?: string
  onClick?: () => void
  isInfoTDPEnabled?: boolean
}
const Balance = (props: BalanceProps) => {
  const { token, chainId, balance, gqlBalance, tokenSymbol, color, chainName, onClick, isInfoTDPEnabled } = props
  const { formatCurrencyAmount, formatNumber } = useFormatter()
  const currencies = useMemo(() => [token], [token])

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
                {formattedBalance} {tokenSymbol}
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
  chainId,
  token,
  theme,
}: {
  connectedChainBalance?: CurrencyAmount<Currency>
  chainId?: ChainId
  token: Currency
  theme: DefaultTheme
}) => {
  const hasConnectedChainBalance = chainId && connectedChainBalance && connectedChainBalance.greaterThan(0)
  if (!hasConnectedChainBalance) return null

  const { label: chainName, color: chainColor } = getChainInfo(asSupportedChain(chainId) ?? ChainId.MAINNET)
  return (
    <BalanceSection>
      <ThemedText.SubHeaderSmall color={theme.neutral1}>
        <Trans>Your balance on {chainName}</Trans>
      </ThemedText.SubHeaderSmall>
      <Balance
        token={token}
        chainId={token.chainId}
        balance={connectedChainBalance}
        tokenSymbol={token.symbol}
        color={chainColor}
        chainName={chainName}
      />
    </BalanceSection>
  )
}

const PageChainBalanceSummary = ({
  pageChainBalance,
  chainId,
  theme,
}: {
  pageChainBalance?: TokenBalance
  chainId: ChainId
  theme: DefaultTheme
}) => {
  if (!pageChainBalance || !pageChainBalance.token) return null
  const currency = gqlToCurrency(pageChainBalance.token)
  return (
    <BalanceSection>
      <ThemedText.HeadlineSmall color={theme.neutral1}>
        <Trans>Your balance</Trans>
      </ThemedText.HeadlineSmall>
      <Balance token={currency} chainId={chainId} gqlBalance={pageChainBalance} isInfoTDPEnabled={true} />
    </BalanceSection>
  )
}

const OtherChainsBalanceSummary = ({
  otherChainBalances,
  hasPageChainBalance,
}: {
  otherChainBalances?: TokenBalance[]
  hasPageChainBalance: boolean
}) => {
  const navigate = useNavigate()
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  const hasOtherChainBalances = otherChainBalances && Boolean(otherChainBalances.length)
  if (!hasOtherChainBalances) return null
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
      {otherChainBalances?.map((balance) => {
        const currency = balance.token && gqlToCurrency(balance.token)
        const chainId = (balance.token && supportedChainIdFromGQLChain(balance.token.chain)) ?? ChainId.MAINNET
        return (
          <Balance
            key={balance.id}
            token={currency}
            chainId={chainId}
            gqlBalance={balance}
            onClick={() =>
              navigate(
                `${isInfoExplorePageEnabled ? '/explore' : ''}/tokens/${balance.token?.chain.toLowerCase()}/${
                  balance.token?.address ?? 'NATIVE'
                }`
              )
            }
            isInfoTDPEnabled={true}
          />
        )
      })}
    </BalanceSection>
  )
}

export default function BalanceSummary({
  token,
  crossChainBalances,
  tokenQueryId,
}: {
  token: Currency
  crossChainBalances?: TokenBalance[]
  tokenQueryId?: string
}) {
  const { account, chainId: connectedChainId } = useWeb3React()
  const theme = useTheme()

  const isInfoTDPEnabled = useInfoTDPEnabled()

  const connectedChainBalance = useCurrencyBalance(account, token)

  const pageChainBalance = crossChainBalances?.find((tokenBalance) => tokenBalance.token?.id === tokenQueryId)
  const otherChainBalances = crossChainBalances?.filter((tokenBalance) => tokenBalance.token?.id !== tokenQueryId)
  const hasBalances = pageChainBalance && otherChainBalances && Boolean(otherChainBalances.length)

  if (!account || !hasBalances) {
    return null
  }
  return (
    <BalancesCard isInfoTDPEnabled={isInfoTDPEnabled}>
      {!isInfoTDPEnabled && (
        <ConnectedChainBalanceSummary
          connectedChainBalance={connectedChainBalance}
          chainId={connectedChainId}
          token={token}
          theme={theme}
        />
      )}
      {isInfoTDPEnabled && (
        <>
          <PageChainBalanceSummary pageChainBalance={pageChainBalance} chainId={token.chainId} theme={theme} />
          <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
        </>
      )}
    </BalancesCard>
  )
}

import { Trans } from '@lingui/macro'
import { ChainId, Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain } from 'constants/chains'
import { DEFAULT_ERC20_DECIMALS, nativeOnChain } from 'constants/tokens'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenBalance, TokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useCrossChainGqlBalances } from 'graphql/data/portfolios'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import JSBI from 'jsbi'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const BalancesCard = styled.div`
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral1};
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: fit-content;
  padding: 16px;
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
  ${({ isInfoTDPEnabled }) => isInfoTDPEnabled && 'margin-left: 8px;'}
`

const StyledNetworkLabel = styled.div`
  color: ${({ color }) => color};
  font-size: 12px;
  line-height: 16px;
`

interface BalanceProps {
  token?: Currency
  chainId: ChainId
  balance: CurrencyAmount<Currency>
  tokenSymbol?: string
  color?: string
  chainName?: string
  isInfoTDPEnabled?: boolean
}
const Balance = (props: BalanceProps) => {
  const { token, chainId, balance, tokenSymbol, color, chainName, isInfoTDPEnabled } = props
  const { formatCurrencyAmount } = useFormatter()
  const currencies = useMemo(() => [token], [token])

  const formattedBalance = formatCurrencyAmount({
    amount: balance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(balance),
    type: NumberType.PortfolioBalance,
  })

  if (isInfoTDPEnabled) {
    return (
      <BalanceRow>
        <PortfolioLogo currencies={currencies} chainId={chainId} size="2rem" />
        <BalanceAmountsContainer isInfoTDPEnabled>
          <BalanceItem>
            <ThemedText.BodyPrimary>{formattedUsdValue}</ThemedText.BodyPrimary>
          </BalanceItem>
          <BalanceItem>
            <ThemedText.SubHeader>{formattedBalance}</ThemedText.SubHeader>
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

function getCurrencyFromPortfolioQuery(chainId: ChainId, portfolioQueryToken: TokenBalance['token']): Currency {
  return portfolioQueryToken?.address
    ? new Token(
        chainId,
        portfolioQueryToken?.address,
        portfolioQueryToken?.decimals ?? DEFAULT_ERC20_DECIMALS,
        portfolioQueryToken?.symbol,
        portfolioQueryToken?.name,
        /* bypassChecksum:*/ true
      )
    : nativeOnChain(chainId)
}

export default function BalanceSummary({ token, tokenQuery }: { token: Currency; tokenQuery: TokenQuery }) {
  const { account, chainId: connectedChainId } = useWeb3React()
  const theme = useTheme()
  const { label: chainName, color: chainColor } = getChainInfo(asSupportedChain(connectedChainId) ?? ChainId.MAINNET)

  const isInfoTDPEnabled = useInfoTDPEnabled()

  const connectedChainBalance = useCurrencyBalance(account, token)
  const hasConnectedChainBalance = connectedChainBalance && connectedChainBalance.greaterThan(0)

  const crossChainBalances = useCrossChainGqlBalances(tokenQuery, account)
  const pageChainBalance = crossChainBalances?.find((tokenBalance) => tokenBalance.token?.id === tokenQuery.token?.id)
  const otherChainBalances = crossChainBalances?.filter(
    (tokenBalance) => tokenBalance.token?.id !== tokenQuery.token?.id
  )
  const hasOtherChainBalances = otherChainBalances && Boolean(otherChainBalances.length)

  const ConnectedChainBalanceSummary = () => {
    if (!hasConnectedChainBalance) return null
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

  const PageChainBalanceSummary = () => {
    if (!pageChainBalance) return null
    const currency = getCurrencyFromPortfolioQuery(token.chainId, pageChainBalance.token)

    return (
      <BalanceSection>
        <ThemedText.SubHeaderSmall color={theme.neutral1}>
          <Trans>Your balance</Trans>
        </ThemedText.SubHeaderSmall>
        <Balance
          token={currency}
          chainId={token.chainId}
          balance={CurrencyAmount.fromRawAmount(
            currency,
            JSBI.BigInt((pageChainBalance.quantity ?? 0) * 10 ** token.decimals)
          )}
          isInfoTDPEnabled={true}
        />
      </BalanceSection>
    )
  }

  const OtherChainsBalanceSummary = () => {
    if (!hasOtherChainBalances) return null
    return (
      <BalanceSection>
        <ThemedText.SubHeaderSmall color={theme.neutral1}>
          <Trans>Balance on other networks</Trans>
        </ThemedText.SubHeaderSmall>
        {otherChainBalances?.map((balance) => {
          const chainId =
            (balance.token?.chain ? supportedChainIdFromGQLChain(balance.token?.chain) : ChainId.MAINNET) ??
            ChainId.MAINNET
          const currency = getCurrencyFromPortfolioQuery(chainId, balance.token)

          return (
            <Balance
              key={balance.id}
              token={currency}
              chainId={chainId}
              balance={CurrencyAmount.fromRawAmount(
                currency,
                JSBI.BigInt((balance.quantity ?? 0) * 10 ** token.decimals)
              )}
              isInfoTDPEnabled={true}
            />
          )
        })}
      </BalanceSection>
    )
  }

  if (!account) {
    return null
  }
  return (
    <BalancesCard>
      {!isInfoTDPEnabled && <ConnectedChainBalanceSummary />}
      {isInfoTDPEnabled && (
        <>
          <PageChainBalanceSummary />
          <OtherChainsBalanceSummary />
        </>
      )}
    </BalancesCard>
  )
}

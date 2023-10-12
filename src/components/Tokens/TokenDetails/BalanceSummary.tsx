import { Trans } from '@lingui/macro'
import { ChainId, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PrefetchBalancesWrapper, {
  useCachedPortfolioBalancesQuery,
} from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain } from 'constants/chains'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { TokenQuery } from 'graphql/data/__generated__/types-and-hooks'
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
  // display: none; // todo: check if this changes anything?
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

export default function BalanceSummary({ token, tokenQuery }: { token: Currency; tokenQuery: TokenQuery }) {
  const { account, chainId } = useWeb3React()
  const theme = useTheme()
  const { label: chainName, color: chainColor } = getChainInfo(asSupportedChain(chainId) ?? ChainId.MAINNET)

  const isInfoTDPEnabled = useInfoTDPEnabled()

  const currentChainBalance = useCurrencyBalance(account, token)
  const hasCurrentChainBalance = currentChainBalance?.greaterThan(0)

  const { data: portfolioBalances } = useCachedPortfolioBalancesQuery({ account })
  const tokenBalances = portfolioBalances?.portfolios?.[0].tokenBalances
  const bridgeInfo = tokenQuery.token?.project?.tokens
  console.log('tokenBalances', tokenBalances)
  const otherChainBalances = tokenBalances?.filter(
    (tokenBalance) =>
      tokenBalance.token?.id !== tokenQuery.token?.id &&
      bridgeInfo?.some((bridgeToken) => bridgeToken.id == tokenBalance.token?.id) // does not include token on currently-selected page chain
  )
  const hasOtherChainBalances = Boolean(otherChainBalances?.length)
  console.log('bridgeInfo', bridgeInfo)

  if (!account || !currentChainBalance) {
    return null
  }

  const CurrentChainBalanceSummary = () => (
    <BalanceSection>
      {isInfoTDPEnabled ? (
        <>
          <ThemedText.SubHeaderSmall color={theme.neutral1}>
            <Trans>Your {token.symbol}</Trans>
          </ThemedText.SubHeaderSmall>
          <Balance token={token} chainId={token.chainId} balance={currentChainBalance} isInfoTDPEnabled={true} />
        </>
      ) : (
        <>
          <ThemedText.SubHeaderSmall color={theme.neutral1}>
            <Trans>Your balance on {chainName}</Trans>
          </ThemedText.SubHeaderSmall>
          <Balance
            token={token}
            chainId={token.chainId}
            balance={currentChainBalance}
            tokenSymbol={token.symbol}
            color={chainColor}
            chainName={chainName}
          />
        </>
      )}
    </BalanceSection>
  )

  const OtherChainsBalanceSummary = () => {
    return (
      <BalanceSection>
        <ThemedText.SubHeaderSmall color={theme.neutral1}>
          <Trans>On other networks</Trans>
        </ThemedText.SubHeaderSmall>
        {otherChainBalances?.map((balance) => {
          return (
            <Balance
              key={balance.id}
              token={token}
              chainId={token.chainId}
              // chainId={balance.token?.chain}
              balance={CurrencyAmount.fromRawAmount(token, JSBI.BigInt((balance.quantity ?? 0) * 10 ** token.decimals))}
              isInfoTDPEnabled={true}
            />
          )
        })}
      </BalanceSection>
    )
  }

  if (isInfoTDPEnabled) {
    // check prefetch balances wrapper cuz it doesnt load, remove isInfoTDPEnabled
    return (
      <PrefetchBalancesWrapper shouldFetchOnAccountUpdate>
        <BalancesCard>
          {hasCurrentChainBalance && <CurrentChainBalanceSummary />}
          {hasOtherChainBalances && <OtherChainsBalanceSummary />}
        </BalancesCard>
      </PrefetchBalancesWrapper>
    )
  } else {
    return (
      <BalancesCard>
        <CurrentChainBalanceSummary />
      </BalancesCard>
    )
  }
}

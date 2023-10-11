import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
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

const BalanceAmountsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const StyledNetworkLabel = styled.div`
  color: ${({ color }) => color};
  font-size: 12px;
  line-height: 16px;
`

interface BalanceProps {
  currencies?: Array<Currency | undefined>
  chainId: ChainId
  formattedBalance: string
  formattedUsdValue: string
  tokenSymbol?: string
  color?: string
  label: string
}
const Balance = ({
  currencies,
  chainId,
  formattedBalance,
  formattedUsdValue,
  tokenSymbol,
  color,
  label,
}: BalanceProps) => (
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
      <StyledNetworkLabel color={color}>{label}</StyledNetworkLabel>
    </BalanceContainer>
  </BalanceRow>
)

export default function BalanceSummary({ token, tokenQuery }: { token: Currency; tokenQuery: TokenQuery }) {
  const { account, chainId } = useWeb3React()
  const theme = useTheme()
  const { label, color } = getChainInfo(asSupportedChain(chainId) ?? ChainId.MAINNET)
  const { formatCurrencyAmount } = useFormatter()

  const isInfoTDPEnabled = useInfoTDPEnabled()

  const currentChainBalance = useCurrencyBalance(account, token)
  const formattedCurrentChainBalance = formatCurrencyAmount({
    amount: currentChainBalance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(currentChainBalance),
    type: NumberType.FiatTokenStats,
  })

  const currencies = useMemo(() => [token], [token])

  const { data: portfolioBalances } = useCachedPortfolioBalancesQuery({ account })
  const tokenBalances = portfolioBalances?.portfolios?.[0].tokenBalances
  const bridgeInfo = tokenQuery.token?.project?.tokens
  const otherChainBalances = tokenBalances?.filter(
    (tokenBalance) =>
      bridgeInfo?.some(
        (bridgeToken) => bridgeToken.id == tokenBalance.token?.id && tokenBalance.token?.id !== tokenQuery.token?.id
      ) // does not include token on currently-selected page chain
  )

  if (!account || !currentChainBalance) {
    return null
  }

  const BalanceSummary = (
    <BalancesCard>
      <BalanceSection>
        <ThemedText.SubHeaderSmall color={theme.neutral1}>
          <Trans>Your balance on {label}</Trans>
        </ThemedText.SubHeaderSmall>
        {isInfoTDPEnabled ? (
          <Balance
            currencies={currencies}
            chainId={token.chainId}
            formattedBalance={formattedCurrentChainBalance}
            formattedUsdValue={formattedUsdValue}
            tokenSymbol={token.symbol}
            color={color}
            label={label}
          />
        ) : (
          <Balance
            currencies={currencies}
            chainId={token.chainId}
            formattedBalance={formattedCurrentChainBalance}
            formattedUsdValue={formattedUsdValue}
            tokenSymbol={token.symbol}
            color={color}
            label={label}
          />
        )}
      </BalanceSection>
      {isInfoTDPEnabled && (
        <BalanceSection>
          <ThemedText.SubHeaderSmall color={theme.neutral1}>
            <Trans>On other networks</Trans>
          </ThemedText.SubHeaderSmall>
          {otherChainBalances?.map((balance) => (
            <Balance
              key={balance.id}
              currencies={currencies} // what dis do
              chainId={token.chainId}
              formattedBalance={formattedCurrentChainBalance}
              formattedUsdValue={formattedUsdValue}
              tokenSymbol={balance.token?.symbol}
              color={color}
              label={label}
            />
          ))}
        </BalanceSection>
      )}
    </BalancesCard>
  )
  if (isInfoTDPEnabled) {
    // check prefetch balances wrapper cuz it doesnt load
    return <PrefetchBalancesWrapper shouldFetchOnAccountUpdate>{BalanceSummary}</PrefetchBalancesWrapper>
  } else {
    return BalanceSummary
  }
}

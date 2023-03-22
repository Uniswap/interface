import { formatNumber, NumberType } from '@uniswap/conedison/format'
import Row from 'components/Row'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { PortfolioBalancesQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleWalletDrawer } from '..'
import { PortfolioArrow } from '../AuthenticatedHeader'
import { hideSmallBalancesAtom } from '../SmallBalanceToggle'
import { ExpandoRow } from './ExpandoRow'
import { PortfolioLogo } from './PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from './PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

function meetsThreshold(tokenBalance: TokenBalance, hideSmallBalances: boolean) {
  return !hideSmallBalances || (tokenBalance.denominatedValue?.value ?? 0) > HIDE_SMALL_USD_BALANCES_THRESHOLD
}

export default function Tokens({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleWalletDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { data } = usePortfolioBalancesQuery({
    variables: { ownerAddress: account },
    fetchPolicy: 'cache-only', // PrefetchBalancesWrapper handles balance fetching/staleness; this component only reads from cache
    errorPolicy: 'all',
  })

  const visibleTokens = useMemo(() => {
    return !hideSmallBalances
      ? data?.portfolios?.[0].tokenBalances ?? []
      : data?.portfolios?.[0].tokenBalances?.filter((tokenBalance) =>
          meetsThreshold(tokenBalance, hideSmallBalances)
        ) ?? []
  }, [data?.portfolios, hideSmallBalances])

  const hiddenTokens = useMemo(() => {
    return !hideSmallBalances
      ? []
      : data?.portfolios?.[0].tokenBalances?.filter(
          (tokenBalance) => !meetsThreshold(tokenBalance, hideSmallBalances)
        ) ?? []
  }, [data?.portfolios, hideSmallBalances])

  if (!data) {
    return <PortfolioSkeleton />
  }

  if (data?.portfolios?.[0].tokenBalances?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map(
        (tokenBalance) =>
          tokenBalance.token &&
          meetsThreshold(tokenBalance, hideSmallBalances) && (
            <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
          )
      )}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenTokens.length}>
        {hiddenTokens.map(
          (tokenBalance) =>
            tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
        )}
      </ExpandoRow>
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`

type TokenBalance = NonNullable<
  NonNullable<NonNullable<PortfolioBalancesQuery['portfolios']>[number]>['tokenBalances']
>[number]

type PortfolioToken = NonNullable<TokenBalance['token']>

function TokenRow({ token, quantity, denominatedValue, tokenProjectMarket }: TokenBalance & { token: PortfolioToken }) {
  const percentChange = tokenProjectMarket?.pricePercentChange?.value ?? 0

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleWalletDrawer()
  const navigateToTokenDetails = useCallback(async () => {
    navigate(getTokenDetailsURL(token))
    toggleWalletDrawer()
  }, [navigate, token, toggleWalletDrawer])

  const currency = gqlToCurrency(token)
  return (
    <PortfolioRow
      left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size="40px" />}
      title={<ThemedText.SubHeader fontWeight={500}>{token?.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText>
          {formatNumber(quantity, NumberType.TokenNonTx)} {token?.symbol}
        </TokenBalanceText>
      }
      onClick={navigateToTokenDetails}
      right={
        denominatedValue && (
          <>
            <ThemedText.SubHeader fontWeight={500}>
              {formatNumber(denominatedValue?.value, NumberType.PortfolioBalance)}
            </ThemedText.SubHeader>
            <Row justify="flex-end">
              <PortfolioArrow change={percentChange} size={20} strokeWidth={1.75} />
              <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
            </Row>
          </>
        )
      }
    />
  )
}

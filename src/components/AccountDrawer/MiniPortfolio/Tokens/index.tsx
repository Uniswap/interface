import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { TokenBalance } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL, gqlToCurrency, logSentryErrorForUnsupportedChain } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { splitHiddenTokens } from 'utils/splitHiddenTokens'

import { useToggleAccountDrawer } from '../..'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { ExpandoRow } from '../ExpandoRow'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

export default function Tokens({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { data } = useCachedPortfolioBalancesQuery({ account })

  const tokenBalances = data?.portfolios?.[0].tokenBalances as TokenBalance[] | undefined

  const { visibleTokens, hiddenTokens } = useMemo(
    () => splitHiddenTokens(tokenBalances ?? [], { hideSmallBalances }),
    [hideSmallBalances, tokenBalances]
  )

  if (!data) {
    return <PortfolioSkeleton />
  }

  if (tokenBalances?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map(
        (tokenBalance) =>
          tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
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
const TokenNameText = styled(ThemedText.SubHeader)`
  ${EllipsisStyle}
`

type PortfolioToken = NonNullable<TokenBalance['token']>

function TokenRow({ token, quantity, denominatedValue, tokenProjectMarket }: TokenBalance & { token: PortfolioToken }) {
  const { formatPercent } = useFormatter()
  const percentChange = tokenProjectMarket?.pricePercentChange?.value ?? 0

  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const navigateToTokenDetails = useCallback(async () => {
    navigate(getTokenDetailsURL(token))
    toggleWalletDrawer()
  }, [navigate, token, toggleWalletDrawer])
  const { formatNumber } = useFormatter()

  const currency = gqlToCurrency(token)
  if (!currency) {
    logSentryErrorForUnsupportedChain({
      extras: { token },
      errorMessage: 'Token from unsupported chain received from Mini Portfolio Token Balance Query',
    })
    return null
  }
  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{ chain_id: currency.chainId, token_name: token?.name, address: token?.address }}
    >
      <PortfolioRow
        left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size="40px" />}
        title={<TokenNameText>{token?.name}</TokenNameText>}
        descriptor={
          <TokenBalanceText>
            {formatNumber({
              input: quantity,
              type: NumberType.TokenNonTx,
            })}{' '}
            {token?.symbol}
          </TokenBalanceText>
        }
        onClick={navigateToTokenDetails}
        right={
          denominatedValue && (
            <>
              <ThemedText.SubHeader>
                {formatNumber({
                  input: denominatedValue?.value,
                  type: NumberType.PortfolioBalance,
                })}
              </ThemedText.SubHeader>
              <Row justify="flex-end">
                <DeltaArrow delta={percentChange} />
                <ThemedText.BodySecondary>{formatPercent(percentChange)}</ThemedText.BodySecondary>
              </Row>
            </>
          )
        }
      />
    </TraceEvent>
  )
}

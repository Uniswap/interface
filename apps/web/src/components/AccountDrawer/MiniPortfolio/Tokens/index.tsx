import { InterfaceElementName } from '@uniswap/analytics-events'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow, {
  PortfolioSkeleton,
  PortfolioTabWrapper,
} from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { hideSmallBalancesAtom } from 'components/AccountDrawer/SmallBalanceToggle'
import { hideSpamAtom } from 'components/AccountDrawer/SpamToggle'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { useTokenBalancesQuery } from 'graphql/data/apollo/TokenBalancesProvider'
import { PortfolioToken } from 'graphql/data/portfolios'
import { getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { PortfolioTokenBalancePartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { splitHiddenTokens } from 'utils/splitHiddenTokens'

export default function Tokens() {
  const accountDrawer = useAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const hideSpam = useAtomValue(hideSpamAtom)
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { data } = useTokenBalancesQuery({ cacheOnly: !accountDrawer.isOpen })

  const tokenBalances = data?.portfolios?.[0]?.tokenBalances

  const { visibleTokens, hiddenTokens } = useMemo(
    () => splitHiddenTokens(tokenBalances ?? [], { hideSmallBalances, hideSpam }),
    [hideSmallBalances, tokenBalances, hideSpam],
  )

  if (!data) {
    return <PortfolioSkeleton />
  }

  if (tokenBalances?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={accountDrawer.close} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map(
        (tokenBalance) =>
          tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />,
      )}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenTokens.length}>
        {hiddenTokens.map(
          (tokenBalance) =>
            tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />,
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

function TokenRow({
  token,
  quantity,
  denominatedValue,
  tokenProjectMarket,
}: PortfolioTokenBalancePartsFragment & { token: PortfolioToken }) {
  const { formatDelta } = useFormatter()
  const percentChange = tokenProjectMarket?.pricePercentChange?.value ?? 0

  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  const navigateToTokenDetails = useCallback(async () => {
    navigate(getTokenDetailsURL({ ...token }))
    accountDrawer.close()
  }, [navigate, token, accountDrawer])
  const { formatNumber } = useFormatter()

  const currency = gqlToCurrency(token)
  if (!currency) {
    logger.error(new Error('Token from unsupported chain received from Mini Portfolio Token Balance Query'), {
      tags: {
        file: 'RecentlySearchedAssets',
        function: 'useRecentlySearchedAssets',
      },
      extra: { token },
    })
    return null
  }
  return (
    <Trace
      logPress
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{
        chain_id: currency.chainId,
        token_name: token?.project?.name ?? token?.name,
        address: token?.address,
      }}
    >
      <PortfolioRow
        left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size={40} />}
        title={<TokenNameText>{token?.project?.name ?? token?.name}</TokenNameText>}
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
                <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
              </Row>
            </>
          )
        }
      />
    </Trace>
  )
}

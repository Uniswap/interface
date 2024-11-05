import { InterfaceElementName } from '@uniswap/analytics-events'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow, {
  PortfolioSkeleton,
  PortfolioTabWrapper,
} from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import Row from 'components/deprecated/Row'
import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { PortfolioBalance, PortfolioToken } from 'graphql/data/portfolios'
import { getTokenDetailsURL, gqlToCurrency } from 'graphql/data/util'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Text, Tooltip } from 'ui/src'
import {
  useEnabledChains,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
} from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTranslation } from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { splitHiddenTokens } from 'utils/splitHiddenTokens'

export default function Tokens() {
  const accountDrawer = useAccountDrawer()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const hideSpam = useHideSpamTokensSetting()
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { isTestnetModeEnabled } = useEnabledChains()

  const { data } = useTokenBalancesQuery({ cacheOnly: !accountDrawer.isOpen })

  const tokenBalances = data?.portfolios?.[0]?.tokenBalances

  const { visibleTokens, hiddenTokens } = useMemo(
    () => splitHiddenTokens(tokenBalances ?? [], { hideSmallBalances, hideSpam, isTestnetModeEnabled }),
    [hideSmallBalances, tokenBalances, hideSpam, isTestnetModeEnabled],
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
}: PortfolioBalance & { token: PortfolioToken }) {
  const { t } = useTranslation()
  const { formatDelta } = useFormatter()
  const { isTestnetModeEnabled } = useEnabledChains()
  const percentChange = tokenProjectMarket?.relativeChange24?.value ?? 0

  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  // TODO: remove when exposing '/explore' route.
  const isExploreRouteActive = false

  const navigateToTokenDetails = useCallback(async () => {
    if (isTestnetModeEnabled || !isExploreRouteActive) {
      return
    }
  
    navigate(getTokenDetailsURL({ ...token }))
    accountDrawer.close()
  }, [navigate, token, accountDrawer, isTestnetModeEnabled, isExploreRouteActive])
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

  const portfolioRow = (
    <PortfolioRow
      left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size={40} />}
      title={<TokenNameText>{token?.name ?? token?.project?.name}</TokenNameText>}
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
  )

  return (
    <Trace
      logPress
      element={InterfaceElementName.MINI_PORTFOLIO_TOKEN_ROW}
      properties={{
        chain_id: currency.chainId,
        token_name: token?.name ?? token?.project?.name,
        address: token?.address,
      }}
    >
      {isTestnetModeEnabled ? (
        <Tooltip placement="right" delay={{ open: 2000 }}>
          <Tooltip.Content>
            <Text variant="body4">{t('token.details.testnet.unsupported')}</Text>
            <Tooltip.Arrow />
          </Tooltip.Content>
          <Tooltip.Trigger>{portfolioRow}</Tooltip.Trigger>
        </Tooltip>
      ) : (
        portfolioRow
      )}
    </Trace>
  )
}

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
import { useAccount } from 'hooks/useAccount'
import { useTokenContextMenu } from 'hooks/useTokenContextMenu'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { Text, Tooltip } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export default function Tokens() {
  const accountDrawer = useAccountDrawer()
  const account = useAccount()

  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { data: sortedPortfolioBalances, loading } = useSortedPortfolioBalances({
    address: account?.address,
  })

  const isLoading = loading && !sortedPortfolioBalances

  const hiddenBalances = sortedPortfolioBalances?.hiddenBalances ?? []
  const visibleBalances = sortedPortfolioBalances?.balances ?? []

  if (isLoading) {
    return <PortfolioSkeleton />
  }

  if (hiddenBalances.length === 0 && visibleBalances.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={accountDrawer.close} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {visibleBalances.map((tokenBalance) => (
        <TokenRow key={tokenBalance.id} tokenBalance={tokenBalance} />
      ))}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenBalances.length}>
        {hiddenBalances.map((tokenBalance) => (
          <TokenRow key={tokenBalance.id} tokenBalance={tokenBalance} />
        ))}
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

function TokenRow({ tokenBalance }: { tokenBalance: PortfolioBalance }) {
  const { t } = useTranslation()
  const { formatDelta, formatNumber } = useFormatter()
  const { isTestnetModeEnabled } = useEnabledChains()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  const menuItems = useTokenContextMenu({
    tokenBalance,
  })

  const currency = tokenBalance.currencyInfo.currency
  const { chainId, name, symbol, isNative } = currency
  const percentChange24 = tokenBalance.relativeChange24 ?? 0
  const tokenAddress = isNative ? NATIVE_TOKEN_PLACEHOLDER : currency.address

  const navigateToTokenDetails = useCallback(async () => {
    if (isTestnetModeEnabled) {
      return
    }

    navigate(
      getTokenDetailsURL({
        address: tokenAddress,
        chain: chainId,
      }),
    )
    accountDrawer.close()
  }, [accountDrawer, isTestnetModeEnabled, navigate, tokenAddress, chainId])

  const portfolioRow = (
    <PortfolioRow
      left={<PortfolioLogo chainId={chainId} currencies={[currency]} size={40} />}
      title={<TokenNameText>{name}</TokenNameText>}
      descriptor={
        <TokenBalanceText>
          {formatNumber({
            input: tokenBalance.quantity,
            type: NumberType.TokenNonTx,
          })}{' '}
          {symbol}
        </TokenBalanceText>
      }
      onClick={navigateToTokenDetails}
      right={
        tokenBalance.balanceUSD && (
          <>
            <ThemedText.SubHeader>
              {formatNumber({
                input: tokenBalance.balanceUSD,
                type: NumberType.PortfolioBalance,
              })}
            </ThemedText.SubHeader>
            <Row justify="flex-end">
              <DeltaArrow delta={percentChange24} />
              <ThemedText.BodySecondary>{formatDelta(percentChange24)}</ThemedText.BodySecondary>
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
        chain_id: chainId,
        token_name: name,
        address: tokenAddress,
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
        <ContextMenu menuStyleProps={{ minWidth: '200px' }} menuItems={menuItems} alignContentLeft>
          {portfolioRow}
        </ContextMenu>
      )}
    </Trace>
  )
}

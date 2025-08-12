import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import Row from 'components/deprecated/Row'
import { useAccount } from 'hooks/useAccount'
import { useTokenContextMenu } from 'hooks/useTokenContextMenu'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ThemedText } from 'theme/components'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { AnimatePresence, Text, Tooltip } from 'ui/src'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { getChainUrlParam } from 'utils/chainParams'

export default function Tokens() {
  const accountDrawer = useAccountDrawer()
  const account = useAccount()

  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { data: sortedPortfolioBalances, loading } = useSortedPortfolioBalances({
    address: account.address,
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
    <AnimatePresence>
      {visibleBalances.map((tokenBalance) => (
        <TokenRow key={tokenBalance.id} tokenBalance={tokenBalance} />
      ))}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenBalances.length}>
        {hiddenBalances.map((tokenBalance) => (
          <TokenRow key={tokenBalance.id} tokenBalance={tokenBalance} />
        ))}
      </ExpandoRow>
    </AnimatePresence>
  )
}

function TokenRow({ tokenBalance }: { tokenBalance: PortfolioBalance }) {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { isTestnetModeEnabled } = useEnabledChains()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  const { value: contextMenuIsOpen, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)
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
        chainUrlParam: getChainUrlParam(chainId),
        inputAddress: tokenAddress,
      }),
    )
    accountDrawer.close()
  }, [accountDrawer, isTestnetModeEnabled, navigate, tokenAddress, chainId])

  const portfolioRow = (
    <PortfolioRow
      left={<PortfolioLogo chainId={chainId} currencies={[currency]} size={40} />}
      title={
        <Text variant="subheading2" {...EllipsisTamaguiStyle}>
          {name}
        </Text>
      }
      descriptor={
        <Text variant="body2" color="$neutral2" {...EllipsisTamaguiStyle}>
          {formatNumberOrString({
            value: tokenBalance.quantity,
            type: NumberType.TokenNonTx,
          })}{' '}
          {symbol}
        </Text>
      }
      onClick={navigateToTokenDetails}
      right={
        tokenBalance.balanceUSD && (
          <>
            <ThemedText.SubHeader>
              {convertFiatAmountFormatted(tokenBalance.balanceUSD, NumberType.PortfolioBalance)}
            </ThemedText.SubHeader>
            <Row justify="flex-end">
              <DeltaArrow delta={percentChange24} formattedDelta={formatPercent(Math.abs(percentChange24))} />
              <ThemedText.BodySecondary>{formatPercent(Math.abs(percentChange24))}</ThemedText.BodySecondary>
            </Row>
          </>
        )
      }
    />
  )

  return (
    <Trace
      logPress
      element={ElementName.MiniPortfolioTokenRow}
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
        <ContextMenu
          menuItems={menuItems}
          triggerMode={ContextMenuTriggerMode.Secondary}
          isOpen={contextMenuIsOpen}
          closeMenu={closeContextMenu}
          openMenu={openContextMenu}
        >
          {portfolioRow}
        </ContextMenu>
      )}
    </Trace>
  )
}

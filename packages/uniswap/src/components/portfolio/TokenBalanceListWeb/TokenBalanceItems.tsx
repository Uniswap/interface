import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { isExtensionApp } from '@universe/environment'
import { type MouseEvent, memo, useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Flex, HeightAnimator, Loader, TouchableArea } from 'ui/src'
import { HiddenTokensRow } from 'uniswap/src/components/portfolio/HiddenTokensRow'
import { TokenBalanceItem } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItem'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { ChainBalanceRow } from 'uniswap/src/components/portfolio/TokenBalanceListWeb/ChainBalanceRow'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { PortfolioBalance, PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { multichainChainTokenRowSuffix } from 'uniswap/src/features/portfolio/balances/flattenMultichainToSingleChainRows'
import { sortPortfolioChainBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import { useTokenBalanceListContext } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

function multichainToPortfolioBalanceForMenu(
  multichain: PortfolioMultichainBalance,
  chainToken: PortfolioChainBalance,
): PortfolioBalance {
  return {
    id: multichain.id,
    cacheId: `${multichain.cacheId}-${chainToken.chainId}`,
    quantity: chainToken.quantity,
    balanceUSD: chainToken.valueUsd,
    currencyInfo: chainToken.currencyInfo,
    relativeChange24: multichain.pricePercentChange1d,
    isHidden: multichain.isHidden,
  }
}

export const TokenBalanceItems = ({
  animated,
  rows,
  openReportTokenModal,
  hiddenTokensRowRef,
}: {
  animated?: boolean
  rows: string[]
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  hiddenTokensRowRef?: React.RefObject<HTMLDivElement | null>
}): JSX.Element => {
  return (
    <Flex
      {...(animated && {
        animation: 'quicker',
        enterStyle: { opacity: 0, y: -10 },
        exitStyle: { opacity: 0, y: -10 },
      })}
    >
      {rows.map((balance: TokenBalanceListRow) => {
        return (
          <TokenBalanceItemRow
            key={balance}
            item={balance}
            openReportTokenModal={openReportTokenModal}
            hiddenTokensRowRef={hiddenTokensRowRef}
          />
        )
      })}
    </Flex>
  )
}

const TokenBalanceItemRow = memo(function TokenBalanceItemRow({
  item,
  openReportTokenModal,
  hiddenTokensRowRef,
}: {
  item: TokenBalanceListRow
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  hiddenTokensRowRef?: React.RefObject<HTMLDivElement | null>
}) {
  const { balancesById, expandedCurrencyIds, isWarmLoading, toggleExpanded, multichainRowExpansionEnabled } =
    useTokenBalanceListContext()
  const { isTestnetModeEnabled } = useEnabledChains()
  const trace = useTrace()
  const dispatch = useDispatch()

  const [isModalVisible, setModalVisible] = useState(false)

  const openModal = useCallback((): void => {
    setModalVisible(true)
  }, [])

  const closeModal = useCallback((): void => {
    setModalVisible(false)
  }, [])

  const parentBalance = balancesById?.[item]

  const orderedChainTokens = useMemo(() => {
    if (!parentBalance || parentBalance.tokens.length <= 1) {
      return []
    }
    return sortPortfolioChainBalances({
      tokens: parentBalance.tokens,
      isTestnetModeEnabled,
    })
  }, [parentBalance, isTestnetModeEnabled])

  const toggleMultichainRow = useCallback(() => {
    if (!parentBalance) {
      return
    }
    const nextExpanded = !expandedCurrencyIds.has(parentBalance.id)
    toggleExpanded(parentBalance.id)
    if (isExtensionApp && multichainRowExpansionEnabled) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.BreakdownExpanded,
        multichainTokenRowState: nextExpanded ? 'open' : 'close',
      })
    }
  }, [expandedCurrencyIds, multichainRowExpansionEnabled, parentBalance, toggleExpanded, trace])

  const suppressContextMenu = useCallback((event: MouseEvent<HTMLElement>): void => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
    },
    [dispatch],
  )

  // Adapter to bridge multichain balance to PortfolioBalance shape for the context menu.
  // Only used with single-chain tokens (tokens.length === 1).
  const portfolioBalance: PortfolioBalance | undefined = useMemo(() => {
    if (!parentBalance?.tokens[0]) {
      return undefined
    }
    const primaryToken = parentBalance.tokens[0]
    return {
      id: parentBalance.id,
      cacheId: parentBalance.cacheId,
      quantity: primaryToken.quantity,
      balanceUSD: parentBalance.totalValueUsd,
      currencyInfo: primaryToken.currencyInfo,
      relativeChange24: parentBalance.pricePercentChange1d,
      isHidden: primaryToken.isHidden,
    }
  }, [parentBalance])

  const parentCurrencyInfo = parentBalance?.tokens[0]?.currencyInfo

  if (isHiddenTokenBalancesRow(item)) {
    return (
      <>
        <Flex ref={hiddenTokensRowRef}>
          <HiddenTokensRow onPressLearnMore={openModal} />
        </Flex>
        <HiddenTokenInfoModal isOpen={isModalVisible} onClose={closeModal} />
      </>
    )
  }

  if (!parentBalance || !portfolioBalance || !parentCurrencyInfo) {
    return (
      <Flex px="$spacing8">
        <Loader.Token />
      </Flex>
    )
  }

  const expandOnPrimaryClick = multichainRowExpansionEnabled && parentBalance.tokens.length > 1

  const tokenBalanceItem = (
    <TokenBalanceItem isLoading={isWarmLoading} currencyInfo={parentCurrencyInfo} portfolioBalance={parentBalance} />
  )

  if (expandOnPrimaryClick) {
    const isMultichainExpanded = expandedCurrencyIds.has(parentBalance.id)
    return (
      // oxlint-disable-next-line react/forbid-elements -- web only, need div to suppress context menu
      <div role="presentation" style={{ width: '100%' }} onContextMenu={suppressContextMenu}>
        <TouchableArea onPress={toggleMultichainRow}>{tokenBalanceItem}</TouchableArea>
        <HeightAnimator unmountChildrenWhenCollapsed open={isMultichainExpanded} animation="quick">
          <Flex gap="$spacing4" pt="$spacing4" px="$spacing8" width="100%">
            {orderedChainTokens.map((chainToken) => {
              const portfolioBalanceForMenu = multichainToPortfolioBalanceForMenu(parentBalance, chainToken)
              return (
                <TokenBalanceItemContextMenu
                  key={multichainChainTokenRowSuffix(chainToken)}
                  portfolioBalance={portfolioBalanceForMenu}
                  isMultichainAsset={parentBalance.tokens.length > 1}
                  copyAddressToClipboard={copyAddressToClipboard}
                  openReportTokenModal={() =>
                    openReportTokenModal(
                      portfolioBalanceForMenu.currencyInfo.currency,
                      portfolioBalanceForMenu.currencyInfo.isSpam,
                    )
                  }
                >
                  <ChainBalanceRow
                    chainId={chainToken.chainId}
                    symbol={chainToken.currencyInfo.currency.symbol}
                    quantity={chainToken.quantity}
                    valueUsd={chainToken.valueUsd ?? undefined}
                  />
                </TokenBalanceItemContextMenu>
              )
            })}
          </Flex>
        </HeightAnimator>
      </div>
    )
  }

  return (
    <TokenBalanceItemContextMenu
      portfolioBalance={portfolioBalance}
      isMultichainAsset={parentBalance.tokens.length > 1}
      copyAddressToClipboard={copyAddressToClipboard}
      openReportTokenModal={() =>
        openReportTokenModal(portfolioBalance.currencyInfo.currency, portfolioBalance.currencyInfo.isSpam)
      }
    >
      {tokenBalanceItem}
    </TokenBalanceItemContextMenu>
  )
})

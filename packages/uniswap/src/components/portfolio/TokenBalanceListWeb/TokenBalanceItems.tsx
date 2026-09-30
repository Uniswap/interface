import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { isExtensionApp } from '@universe/environment'
import { cn, Flex, Loader, TouchableArea } from '@universe/mycelium'
import { curveToAnimationTiming, ENTER_EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { type ComponentRef, type MouseEvent, forwardRef, memo, useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { HeightAnimator } from 'ui/src'
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
import {
  useTokenBalanceItemConfig,
  useTokenBalanceRowBalance,
} from 'uniswap/src/features/portfolio/TokenBalanceListContext'
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

// Timing of the legacy `quicker` animation preset that drove the enter/exit pair below.
const ANIMATION_TIMING = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS.quicker)

// Enter and exit both run as CSS keyframes so the `Presence` wrapper in TokenBalanceListWeb owns
// the whole lifecycle. `initial={false}` suppresses the enter for rows already expanded on first
// render (`hiddenTokensExpanded` can start true). Measured: the suppression arrives via the
// `data-presence-skip-enter` attribute Presence sets directly on the DOM node, not via its
// className strip — the strip only sees a class the PARENT passed, and this preset is composed
// here inside the child. The compat.css guard resolves that attribute to `animation: none`.
export const TokenBalanceItems = forwardRef<
  ComponentRef<typeof Flex>,
  {
    animated?: boolean
    rows: string[]
    openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
    hiddenTokensRowRef?: React.RefObject<HTMLDivElement | null>
    /**
     * Merged onto the animated node rather than dropped: `Presence` clones its child with an
     * overlay `className` (its `getExitProps` channel, and the `initial={false}` enter strip), so
     * a child that ignores this prop silently loses whatever the wrapper injected.
     */
    className?: string
  }
>(function TokenBalanceItems(
  { animated, rows, openReportTokenModal, hiddenTokensRowRef, className },
  ref,
): JSX.Element {
  return (
    <Flex
      ref={ref}
      className={animated ? cn(ENTER_EXIT_PRESET_CLASSES.fadeInDownOutUp, className) : className}
      {...(animated && { style: ANIMATION_TIMING })}
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
})

const TokenBalanceItemRow = memo(function TokenBalanceItemRow({
  item,
  openReportTokenModal,
  hiddenTokensRowRef,
}: {
  item: TokenBalanceListRow
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  hiddenTokensRowRef?: React.RefObject<HTMLDivElement | null>
}) {
  // Per-key subscription + poll-stable config, NOT the full list context: its value has a new
  // identity on every portfolio poll, which re-rendered every mounted row even when nothing they
  // render changed.
  const parentBalance = useTokenBalanceRowBalance(item)
  const { expandedCurrencyIds, isWarmLoading, toggleExpanded, multichainRowExpansionEnabled } =
    useTokenBalanceItemConfig()
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

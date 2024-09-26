import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { AnimatePresence, ContextMenu, Flex, Loader } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName, SectionName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InformationBanner } from 'wallet/src/components/banners/InformationBanner'
import { InfoLinkModal } from 'wallet/src/components/modals/InfoLinkModal'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { HiddenTokensRow } from 'wallet/src/features/portfolio/HiddenTokensRow'
import { PortfolioEmptyState } from 'wallet/src/features/portfolio/PortfolioEmptyState'
import { TokenBalanceItem } from 'wallet/src/features/portfolio/TokenBalanceItem'
import {
  HIDDEN_TOKEN_BALANCES_ROW,
  TokenBalanceListContextProvider,
  TokenBalanceListRow,
  useTokenBalanceListContext,
} from 'wallet/src/features/portfolio/TokenBalanceListContext'
import { useTokenContextMenu } from 'wallet/src/features/portfolio/useTokenContextMenu'

const MIN_CONTEXT_MENU_WIDTH = 200

type TokenBalanceListProps = {
  owner: Address
}

export const TokenBalanceList = memo(function _TokenBalanceList({ owner }: TokenBalanceListProps): JSX.Element {
  const { navigateToTokenDetails } = useWalletNavigation()

  const onPressToken = (currencyId: string): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenItem,
      section: SectionName.HomeTokensTab,
    })
    navigateToTokenDetails(currencyId)
  }

  return (
    <Flex grow>
      <TokenBalanceListContextProvider isExternalProfile={false} owner={owner} onPressToken={onPressToken}>
        <TokenBalanceListInner />
      </TokenBalanceListContextProvider>
    </Flex>
  )
})

export function TokenBalanceListInner(): JSX.Element {
  const { t } = useTranslation()

  const { rows, balancesById, networkStatus, refetch, hiddenTokensExpanded } = useTokenBalanceListContext()
  const onPressBuy = useInterfaceBuyNavigator(ElementName.EmptyStateBuy)

  const visible: string[] = []
  const hidden: string[] = []

  let isHidden = false
  for (const row of rows) {
    const target = isHidden ? hidden : visible
    target.push(row)
    // do this after pushing so we keep our Hidden header row in the visible section
    // so users can see it when closed and re-open it
    if (row === HIDDEN_TOKEN_BALANCES_ROW) {
      isHidden = true
    }
  }

  const onPressReceive = (): void => {
    navigate(AppRoutes.Receive)
  }

  return (
    <Flex>
      {!balancesById ? (
        isNonPollingRequestInFlight(networkStatus) ? (
          <Flex>
            <Loader.Token withPrice repeat={6} />
          </Flex>
        ) : (
          <Flex fill grow justifyContent="center" pt="$spacing48" px="$spacing36">
            <BaseCard.ErrorState
              retryButtonLabel={t('common.button.retry')}
              title={t('home.tokens.error.load')}
              onRetry={(): void | undefined => refetch?.()}
            />
          </Flex>
        )
      ) : rows.length === 0 ? (
        <PortfolioEmptyState disableCexTransfers onPressBuy={onPressBuy} onPressReceive={onPressReceive} />
      ) : (
        <>
          <TokenBalanceItems rows={visible} />
          <AnimatePresence initial={false}>
            {hiddenTokensExpanded && <TokenBalanceItems animated rows={hidden} />}
          </AnimatePresence>
        </>
      )}
    </Flex>
  )
}

const TokenBalanceItems = ({ animated, rows }: { animated?: boolean; rows: string[] }): JSX.Element => {
  return (
    <Flex
      {...(animated && {
        animation: 'quick',
        enterStyle: { opacity: 0, y: -10 },
        exitStyle: { opacity: 0, y: -10 },
      })}
    >
      {rows?.map((balance: TokenBalanceListRow) => {
        return <TokenBalanceItemRow key={balance} item={balance} />
      })}
    </Flex>
  )
}

const TokenBalanceItemRow = memo(function TokenBalanceItemRow({ item }: { item: TokenBalanceListRow }) {
  const {
    balancesById,
    hiddenTokensCount,
    hiddenTokensExpanded,
    isWarmLoading,
    onPressToken,
    setHiddenTokensExpanded,
  } = useTokenBalanceListContext()

  const { t } = useTranslation()
  const [isModalVisible, setModalVisible] = useState(false)

  const handlePressToken = (): void => {
    setModalVisible(true)
  }

  const closeModal = (): void => {
    setModalVisible(false)
  }

  const handleAnalytics = (): void => {
    sendAnalyticsEvent(WalletEventName.ExternalLinkOpened, {
      url: uniswapUrls.helpArticleUrls.hiddenTokenInfo,
    })
  }

  if (item === HIDDEN_TOKEN_BALANCES_ROW) {
    return (
      <>
        <HiddenTokensRow
          isExpanded={hiddenTokensExpanded}
          numHidden={hiddenTokensCount}
          onPress={(): void => {
            setHiddenTokensExpanded(!hiddenTokensExpanded)
          }}
        />
        {hiddenTokensExpanded && (
          <Flex mx="$spacing12">
            <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={handlePressToken} />
          </Flex>
        )}

        <InfoLinkModal
          showCloseButton
          buttonText={t('common.button.close')}
          buttonTheme="tertiary"
          description={t('hidden.tokens.info.text.info')}
          icon={
            <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
              <ShieldCheck color="$neutral1" size="$icon.24" />
            </Flex>
          }
          isOpen={isModalVisible}
          linkText={t('common.button.learn')}
          linkUrl={uniswapUrls.helpArticleUrls.hiddenTokenInfo}
          name={ModalName.HiddenTokenInfoModal}
          title={t('hidden.tokens.info.text.title')}
          onAnalyticsEvent={handleAnalytics}
          onButtonPress={closeModal}
          onDismiss={closeModal}
        />
      </>
    )
  }

  const portfolioBalance = balancesById?.[item]

  if (!portfolioBalance) {
    // This can happen when the view is out of focus and the user sells/sends 100% of a token's balance.
    // In that case, the token is removed from the `balancesById` object, but the FlatList is still using the cached array of IDs until the view comes back into focus.
    // As soon as the view comes back into focus, the FlatList will re-render with the latest data, so users won't really see this Skeleton for more than a few milliseconds when this happens.
    return (
      <Flex px="$spacing8">
        <Loader.Token />
      </Flex>
    )
  }

  return (
    <TokenContextMenu portfolioBalance={portfolioBalance}>
      <TokenBalanceItem isLoading={isWarmLoading} portfolioBalance={portfolioBalance} onPressToken={onPressToken} />
    </TokenContextMenu>
  )
})

function TokenContextMenu({
  children,
  portfolioBalance,
}: PropsWithChildren<{
  portfolioBalance: PortfolioBalance
}>): JSX.Element {
  const contextMenu = useTokenContextMenu({
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyLevel === SafetyLevel.Blocked,
    tokenSymbolForNotification: portfolioBalance?.currencyInfo?.currency?.symbol,
    portfolioBalance,
  })

  const menuOptions = contextMenu.menuActions.map((action) => ({
    label: action.title,
    onPress: action.onPress,
    Icon: action.Icon,
    destructive: action.destructive,
    disabled: action.disabled,
  }))

  const itemId = `${portfolioBalance.currencyInfo.currencyId}-${portfolioBalance.isHidden}`

  return (
    <ContextMenu itemId={itemId} menuOptions={menuOptions} menuStyleProps={{ minWidth: MIN_CONTEXT_MENU_WIDTH }}>
      {children}
    </ContextMenu>
  )
}

import { NetworkStatus } from '@apollo/client'
import { PropsWithChildren, memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInterfaceBuyNavigator } from 'src/app/features/for/utils'
import { AppRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { AnimatePresence, Flex, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { isError, isNonPollingRequestInFlight } from 'uniswap/src/data/utils'
import { PortfolioBalance, TokenList } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
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
  return (
    <Flex grow>
      <TokenBalanceListContextProvider isExternalProfile={false} owner={owner}>
        <TokenBalanceListInner />
      </TokenBalanceListContextProvider>
    </Flex>
  )
})

function TokenBalanceListInner(): JSX.Element {
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
    navigate(`/${AppRoutes.Receive}`)
  }

  const hasData = !!balancesById
  const hasTokens = balancesById && Object.keys(balancesById).length > 0
  const hasErrorWithCachedValues = hasData && networkStatus === NetworkStatus.error
  const hasErrorWithoutCachedValues = isError(networkStatus, hasData)
  const isLoadingWithoutCachedValues = !hasData && isNonPollingRequestInFlight(networkStatus)

  if (isLoadingWithoutCachedValues) {
    return (
      <Flex>
        <Loader.Token withPrice repeat={6} />
      </Flex>
    )
  }

  if (hasErrorWithoutCachedValues) {
    return (
      <Flex fill grow justifyContent="center" pt="$spacing48" px="$spacing36">
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('home.tokens.error.load')}
          onRetry={(): void | undefined => refetch?.()}
        />
      </Flex>
    )
  }

  if (!hasTokens) {
    return (
      <Flex>
        <PortfolioEmptyState disableCexTransfers onPressBuy={onPressBuy} onPressReceive={onPressReceive} />
      </Flex>
    )
  }

  return (
    <>
      {hasErrorWithCachedValues && (
        <Flex>
          <BaseCard.InlineErrorState title={t('home.tokens.error.fetch')} onRetry={refetch} />
        </Flex>
      )}
      <TokenBalanceItems rows={visible} />
      <AnimatePresence initial={false}>
        {hiddenTokensExpanded && <TokenBalanceItems animated rows={hidden} />}
      </AnimatePresence>
    </>
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
      {rows.map((balance: TokenBalanceListRow) => {
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

  if (item === HIDDEN_TOKEN_BALANCES_ROW) {
    return (
      <>
        <ExpandoRow
          isExpanded={hiddenTokensExpanded}
          label={t('hidden.tokens.info.text.button', { numHidden: hiddenTokensCount })}
          onPress={(): void => {
            setHiddenTokensExpanded(!hiddenTokensExpanded)
          }}
        />
        {hiddenTokensExpanded && (
          <Flex>
            <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={handlePressToken} />
          </Flex>
        )}

        <HiddenTokenInfoModal onClose={closeModal} isOpen={isModalVisible} />
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
      <TokenBalanceItem
        isHidden={portfolioBalance.isHidden ?? false}
        isLoading={isWarmLoading}
        portfolioBalanceId={portfolioBalance.id}
        currencyInfo={portfolioBalance.currencyInfo}
        onPressToken={onPressToken}
      />
    </TokenContextMenu>
  )
})

function TokenContextMenu({
  children,
  portfolioBalance,
}: PropsWithChildren<{
  portfolioBalance: PortfolioBalance
}>): JSX.Element {
  const { menuActions } = useTokenContextMenu({
    currencyId: portfolioBalance.currencyInfo.currencyId,
    isBlocked: portfolioBalance.currencyInfo.safetyInfo?.tokenList === TokenList.Blocked,
    tokenSymbolForNotification: portfolioBalance.currencyInfo.currency.symbol,
    portfolioBalance,
  })

  const menuOptions = menuActions.map((action) => ({
    label: action.title,
    onPress: action.onPress,
    Icon: action.Icon,
    destructive: action.destructive,
    disabled: action.disabled,
  }))

  const itemId = `${portfolioBalance.currencyInfo.currencyId}-${portfolioBalance.isHidden}`

  return (
    <ContextMenu
      closeOnClick
      itemId={itemId}
      menuOptions={menuOptions}
      menuStyleProps={{ minWidth: MIN_CONTEXT_MENU_WIDTH }}
      onLeftClick
    >
      {children}
    </ContextMenu>
  )
}

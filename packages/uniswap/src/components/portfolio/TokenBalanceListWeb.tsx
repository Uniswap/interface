import { NetworkStatus } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AnimatePresence, Flex, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { HiddenTokensRow } from 'uniswap/src/components/portfolio/HiddenTokensRow'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { TokenBalanceItem } from 'uniswap/src/components/portfolio/TokenBalanceItem'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItemContextMenu'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import {
  TokenBalanceListContextProvider,
  useTokenBalanceListContext,
} from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { isHiddenTokenBalancesRow, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { CurrencyId } from 'uniswap/src/types/currency'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { usePrevious } from 'utilities/src/react/hooks'

type TokenBalanceListProps = {
  evmOwner?: Address
  svmOwner?: Address
  onPressReceive: () => void
  onPressBuy: () => void
  onPressToken?: (currencyId: CurrencyId) => void
  openReportTokenModal: (currency: Currency, isMarkedSpam: Maybe<boolean>) => void
  backgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
}

export const TokenBalanceListWeb = memo(function _TokenBalanceList({
  evmOwner,
  svmOwner,
  onPressReceive,
  onPressBuy,
  onPressToken,
  openReportTokenModal,
  backgroundImageWrapperCallback,
}: TokenBalanceListProps): JSX.Element {
  return (
    <Flex grow>
      <TokenBalanceListContextProvider
        isExternalProfile={false}
        evmOwner={evmOwner}
        svmOwner={svmOwner}
        onPressToken={onPressToken}
      >
        <TokenBalanceListInner
          backgroundImageWrapperCallback={backgroundImageWrapperCallback}
          openReportTokenModal={openReportTokenModal}
          onPressReceive={onPressReceive}
          onPressBuy={onPressBuy}
        />
      </TokenBalanceListContextProvider>
    </Flex>
  )
})

function TokenBalanceListInner({
  onPressReceive,
  onPressBuy,
  openReportTokenModal,
  backgroundImageWrapperCallback,
}: Omit<TokenBalanceListProps, 'owner' | 'onPressToken'>): JSX.Element {
  const { t } = useTranslation()

  const { rows, balancesById, networkStatus, refetch, hiddenTokensExpanded } = useTokenBalanceListContext()
  const hiddenTokensRowRef = useRef<HTMLDivElement | null>(null)
  const previousHiddenTokensExpanded = usePrevious(hiddenTokensExpanded)

  // Handle auto scroll, after hiding section of hidden tokens.
  // We additionally wait 100ms to allow the animation to start before scrolling.
  useEffect(() => {
    // Only scroll when transitioning from expanded to collapsed (not on initial render)
    if (previousHiddenTokensExpanded && !hiddenTokensExpanded) {
      // Use setTimeout to ensure the animation has started before scrolling
      const timeoutId = setTimeout(() => {
        hiddenTokensRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      }, 100) // Allow animation to start before scrolling

      return () => clearTimeout(timeoutId)
    }

    return () => {}
  }, [hiddenTokensExpanded, previousHiddenTokensExpanded])

  const visible: string[] = []
  const hidden: string[] = []

  let isHidden = false
  for (const row of rows) {
    const target = isHidden ? hidden : visible
    target.push(row)
    // do this after pushing so we keep our Hidden header row in the visible section
    // so users can see it when closed and re-open it
    if (isHiddenTokenBalancesRow(row)) {
      isHidden = true
    }
  }

  const hasData = !!balancesById
  const hasTokens = balancesById && Object.keys(balancesById).length > 0
  const hasErrorWithCachedValues = hasData && networkStatus === NetworkStatus.error

  if (!hasData) {
    return (
      <EmptyTokensList
        emptyCondition={!hasTokens}
        errorCardContainerStyle={{
          fill: true,
          grow: true,
          justifyContent: 'center',
          pt: '$spacing48',
          px: '$spacing36',
        }}
      />
    )
  }

  if (!hasTokens) {
    return (
      <Flex>
        <PortfolioEmptyState
          disableCexTransfers
          backgroundImageWrapperCallback={backgroundImageWrapperCallback}
          onPressBuy={onPressBuy}
          onPressReceive={onPressReceive}
        />
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
      <TokenBalanceItems
        rows={visible}
        openReportTokenModal={openReportTokenModal}
        hiddenTokensRowRef={hiddenTokensRowRef}
      />
      <AnimatePresence initial={false}>
        {hiddenTokensExpanded && (
          <TokenBalanceItems animated rows={hidden} openReportTokenModal={openReportTokenModal} />
        )}
      </AnimatePresence>
    </>
  )
}

const TokenBalanceItems = ({
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
  const { balancesById, isWarmLoading, onPressToken } = useTokenBalanceListContext()
  const dispatch = useDispatch()

  const [isModalVisible, setModalVisible] = useState(false)

  const openModal = useCallback((): void => {
    setModalVisible(true)
  }, [])

  const closeModal = useCallback((): void => {
    setModalVisible(false)
  }, [])

  const portfolioBalance = useMemo(() => balancesById?.[item], [balancesById, item])

  const handlePressToken = useCallback((): void => {
    const currencyId = portfolioBalance?.currencyInfo.currencyId
    if (currencyId && onPressToken) {
      onPressToken(currencyId)
    }
  }, [onPressToken, portfolioBalance?.currencyInfo.currencyId])

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
    <TokenBalanceItemContextMenu
      portfolioBalance={portfolioBalance}
      copyAddressToClipboard={copyAddressToClipboard}
      openReportTokenModal={() =>
        openReportTokenModal(portfolioBalance.currencyInfo.currency, portfolioBalance.currencyInfo.isSpam)
      }
      onPressToken={handlePressToken}
    >
      <TokenBalanceItem
        isHidden={portfolioBalance.isHidden ?? false}
        isLoading={isWarmLoading}
        currencyInfo={portfolioBalance.currencyInfo}
      />
    </TokenBalanceItemContextMenu>
  )
})

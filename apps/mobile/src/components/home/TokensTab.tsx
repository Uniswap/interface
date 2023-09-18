import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { WalletEmptyState } from 'src/components/home/WalletEmptyState'
import { NoTokens } from 'src/components/icons/NoTokens'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabContentProps, TabProps } from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Flex } from 'ui/src'
import { GQLQueries } from 'wallet/src/data/queries'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export const TOKENS_TAB_DATA_DEPENDENCIES = [GQLQueries.PortfolioBalances]

// ignore ref type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TokensTab = forwardRef<FlashList<any>, TabProps & { isExternalProfile?: boolean }>(
  function _TokensTab(
    {
      owner,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      onRefresh,
      refreshing,
      headerHeight,
    },
    ref
  ) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()

    const onPressToken = (currencyId: CurrencyId): void => {
      tokenDetailsNavigation.navigate(currencyId)
    }

    // Update list empty styling based on which empty state is used
    const formattedContainerProps: TabContentProps | undefined = useMemo(() => {
      if (!containerProps) {
        return undefined
      }
      if (!isExternalProfile) {
        return { ...containerProps, emptyContainerStyle: {} }
      }
      return containerProps
    }, [containerProps, isExternalProfile])

    const onPressAction = (): void => {
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      )
    }

    return (
      <Flex grow bg="$surface1" gap="$none">
        <TokenBalanceList
          ref={ref}
          containerProps={formattedContainerProps}
          empty={
            // Show different empty state on external profile pages
            isExternalProfile ? (
              <BaseCard.EmptyState
                description={t('When this wallet buys or receives tokens, they’ll appear here.')}
                icon={<NoTokens />}
                title={t('No tokens yet')}
                onPress={onPressAction}
              />
            ) : (
              <WalletEmptyState />
            )
          }
          headerHeight={headerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshing={refreshing}
          scrollHandler={scrollHandler}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Flex>
    )
  }
)

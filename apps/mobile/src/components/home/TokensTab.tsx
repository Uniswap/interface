import { useStartProfiler } from '@shopify/react-native-performance'
import React, { forwardRef, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { WalletEmptyState } from 'src/components/home/WalletEmptyState'
import { NoTokens } from 'src/components/icons/NoTokens'
import { TabContentProps, TabProps } from 'src/components/layout/TabHelpers'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { Flex } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { GQLQueries } from 'wallet/src/data/queries'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export const TOKENS_TAB_DATA_DEPENDENCIES = [GQLQueries.PortfolioBalances]

// ignore ref type

export const TokensTab = memo(
  forwardRef<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FlatList<any>,
    TabProps & { isExternalProfile?: boolean }
  >(function _TokensTab(
    {
      owner,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      renderedInModal = false,
      onRefresh,
      refreshing,
      headerHeight,
    },
    ref
  ) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()
    const startProfilerTimer = useStartProfiler()

    const onPressToken = (currencyId: CurrencyId): void => {
      startProfilerTimer({ source: Screens.Home })
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
      <Flex grow bg="$surface1">
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
          renderedInModal={renderedInModal}
          scrollHandler={scrollHandler}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Flex>
    )
  })
)

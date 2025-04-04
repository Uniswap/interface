import { useStartProfiler } from '@shopify/react-native-performance'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TabProps } from 'src/components/layout/TabHelpers'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex } from 'ui/src'
import { NoTokens } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { PortfolioEmptyState } from 'wallet/src/features/portfolio/PortfolioEmptyState'
import { TokenBalanceListRow } from 'wallet/src/features/portfolio/TokenBalanceListContext'

export const TOKENS_TAB_DATA_DEPENDENCIES = [GQLQueries.PortfolioBalances]

// ignore ref type

export const TokensTab = memo(
  forwardRef<FlatList<TokenBalanceListRow>, TabProps & { isExternalProfile?: boolean }>(function _TokensTab(
    {
      owner,
      containerProps,
      scrollHandler,
      isExternalProfile = false,
      renderedInModal = false,
      onRefresh,
      refreshing,
      headerHeight,
      testID,
    },
    ref,
  ) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()
    const startProfilerTimer = useStartProfiler()
    const cexTransferProviders = useCexTransferProviders()

    const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

    const onPressToken = useCallback(
      (currencyId: CurrencyId): void => {
        startProfilerTimer({ source: MobileScreens.Home })
        tokenDetailsNavigation.navigate(currencyId)
      },
      [startProfilerTimer, tokenDetailsNavigation],
    )

    const onPressAction = useCallback((): void => {
      dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
    }, [dispatch])

    const onPressBuy = useCallback(() => {
      disableForKorea
        ? navigate(ModalName.KoreaCexTransferInfoModal)
        : dispatch(
            openModal({
              name: ModalName.FiatOnRampAggregator,
            }),
          )
    }, [disableForKorea, dispatch])

    const onPressReceive = useCallback(() => {
      dispatch(
        openModal(
          cexTransferProviders.length > 0
            ? {
                name: ModalName.ReceiveCryptoModal,
                initialState: cexTransferProviders,
              }
            : {
                name: ModalName.WalletConnectScan,
                initialState: ScannerModalState.WalletQr,
              },
        ),
      )
    }, [cexTransferProviders, dispatch])

    const onPressImport = useCallback(() => {
      dispatch(openModal({ name: ModalName.AccountSwitcher }))
    }, [dispatch])

    const renderEmpty = useMemo((): JSX.Element => {
      // Show different empty state on external profile pages
      return isExternalProfile ? (
        <Flex centered pt="$spacing48" px="$spacing36" style={containerProps?.emptyComponentStyle}>
          <BaseCard.EmptyState
            description={t('home.tokens.empty.description')}
            icon={<NoTokens color="$neutral3" size="$icon.70" />}
            title={t('home.tokens.empty.title')}
            onPress={onPressAction}
          />
        </Flex>
      ) : (
        <PortfolioEmptyState onPressBuy={onPressBuy} onPressImport={onPressImport} onPressReceive={onPressReceive} />
      )
    }, [
      isExternalProfile,
      onPressAction,
      onPressBuy,
      onPressImport,
      onPressReceive,
      containerProps?.emptyComponentStyle,
      t,
    ])

    return (
      <Flex grow backgroundColor="$surface1">
        <TokenBalanceList
          ref={ref}
          containerProps={containerProps}
          empty={renderEmpty}
          headerHeight={headerHeight}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshing={refreshing}
          renderedInModal={renderedInModal}
          scrollHandler={scrollHandler}
          testID={testID}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Flex>
    )
  }),
)

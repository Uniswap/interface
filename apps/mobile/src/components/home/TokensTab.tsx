import { useStartProfiler } from '@shopify/react-native-performance'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { TabProps } from 'src/components/layout/TabHelpers'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex } from 'ui/src'
import { NoTokens } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { usePortfolioEmptyStateBackground } from 'wallet/src/components/portfolio/empty'

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
    const onPressReceive = useOpenReceiveModal()
    const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()

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

    const onPressImport = useCallback(() => {
      navigate(ModalName.AccountSwitcher)
    }, [])

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
        <PortfolioEmptyState
          backgroundImageWrapperCallback={backgroundImageWrapperCallback}
          onPressBuy={onPressBuy}
          onPressImport={onPressImport}
          onPressReceive={onPressReceive}
        />
      )
    }, [
      isExternalProfile,
      containerProps?.emptyComponentStyle,
      t,
      onPressAction,
      onPressBuy,
      onPressImport,
      onPressReceive,
      backgroundImageWrapperCallback,
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

import { useStartProfiler } from '@shopify/react-native-performance'
import { Flex, type UniversalListRef } from '@universe/mycelium'
import React, { forwardRef, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { TabProps } from 'src/components/layout/TabHelpers'
import { TokenBalanceList } from 'src/components/TokenBalanceList/TokenBalanceList'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { NoTokens } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { useIsForRegionBlocked } from 'uniswap/src/features/fiatOnRamp/useIsForRegionBlocked'
import { TokenBalancePressOptions } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { usePortfolioEmptyStateBackground } from 'wallet/src/components/portfolio/empty'

export const TokensTab = memo(
  forwardRef<UniversalListRef, TabProps & { isExternalProfile?: boolean }>(function TokensTabInner(
    { owner, containerProps, isExternalProfile = false, renderedInModal = false, onRefresh, refreshing, testID },
    ref,
  ) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()
    const startProfilerTimer = useStartProfiler()
    const onPressReceive = useOpenReceiveModal()
    const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()

    const isForRegionBlocked = useIsForRegionBlocked({ isOfframp: false })

    const onPressToken = useCallback(
      (currencyId: CurrencyId, options?: TokenBalancePressOptions): void => {
        startProfilerTimer({ source: MobileScreens.Home })
        tokenDetailsNavigation.navigate(currencyId, options)
      },
      [startProfilerTimer, tokenDetailsNavigation],
    )

    const onPressAction = useCallback((): void => {
      dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
    }, [dispatch])

    const onPressBuy = useCallback(() => {
      isForRegionBlocked
        ? navigate(ModalName.CexTransferInfoModal)
        : dispatch(
            openModal({
              name: ModalName.FiatOnRampAggregator,
            }),
          )
    }, [isForRegionBlocked, dispatch])

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
      <Flex fill backgroundColor="$surface1">
        <TokenBalanceList
          ref={ref}
          containerProps={containerProps}
          empty={renderEmpty}
          isExternalProfile={isExternalProfile}
          owner={owner}
          refreshing={refreshing}
          renderedInModal={renderedInModal}
          testID={testID}
          onPressToken={onPressToken}
          onRefresh={onRefresh}
        />
      </Flex>
    )
  }),
)

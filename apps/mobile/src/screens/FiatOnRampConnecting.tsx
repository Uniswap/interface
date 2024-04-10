import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { skipToken } from '@reduxjs/toolkit/query/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import {
  FiatOnRampConnectingView,
  SERVICE_PROVIDER_ICON_SIZE,
} from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { getServiceProviderForQuote } from 'src/features/fiatOnRamp/utils'
import { closeModal } from 'src/features/modals/modalSlice'
import { FiatOnRampScreens } from 'src/screens/Screens'
import { Flex, useIsDarkMode } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { isAndroid } from 'uniswap/src/utils/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { useFiatOnRampAggregatorWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { getServiceProviderLogo } from 'wallet/src/features/fiatOnRamp/utils'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { FiatOnRampEventName, ModalName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

// Design decision
const CONNECTING_TIMEOUT = 2 * ONE_SECOND_MS

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.Connecting>

export function FiatOnRampConnectingScreen({ navigation }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { addFiatSymbolToNumber } = useLocalizationContext()
  const [timeoutElapsed, setTimeoutElapsed] = useState(false)
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    selectedQuote,
    quotesSections,
    serviceProviders,
    countryCode,
    baseCurrencyInfo,
    quoteCurrency,
    amount,
  } = useFiatOnRampContext()
  const serviceProvider = getServiceProviderForQuote(selectedQuote, serviceProviders)

  const initialTypeInfo = useMemo(
    () => ({ serviceProviderLogo: serviceProvider?.logos }),
    [serviceProvider?.logos]
  )

  const { externalTransactionId, dispatchAddTransaction } = useFiatOnRampTransactionCreator(
    activeAccountAddress,
    quoteCurrency.currencyInfo?.currency.chainId ?? ChainId.Mainnet,
    initialTypeInfo
  )

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('common.error.general'),
      })
    )
    navigation.goBack()
  }, [dispatch, navigation, t])

  const {
    data: widgetData,
    isLoading: widgetLoading,
    error: widgetError,
  } = useFiatOnRampAggregatorWidgetQuery(
    serviceProvider && quoteCurrency?.currencyInfo?.currency.symbol && baseCurrencyInfo && amount
      ? {
          serviceProvider: serviceProvider.serviceProvider,
          countryCode,
          destinationCurrencyCode: quoteCurrency?.currencyInfo?.currency.symbol,
          sourceAmount: amount,
          sourceCurrencyCode: baseCurrencyInfo.code,
          walletAddress: activeAccountAddress,
          externalSessionId: externalTransactionId,
          redirectUrl: `${
            isAndroid ? uniswapUrls.appUrl : uniswapUrls.appBaseUrl
          }/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
        }
      : skipToken
  )

  useTimeout(() => {
    setTimeoutElapsed(true)
  }, CONNECTING_TIMEOUT)

  useEffect(() => {
    if (!baseCurrencyInfo || !serviceProvider || widgetError) {
      onError()
      return
    }
    async function navigateToWidget(widgetUrl: string): Promise<void> {
      dispatch(closeModal({ name: ModalName.FiatOnRampAggregator }))
      if (
        serviceProvider &&
        quoteCurrency?.currencyInfo?.currency.symbol &&
        baseCurrencyInfo &&
        quotesSections?.[0]?.data?.[0]
      ) {
        sendWalletAnalyticsEvent(FiatOnRampEventName.FiatOnRampWidgetOpened, {
          externalTransactionId,
          serviceProvider: serviceProvider.serviceProvider,
          preselectedServiceProvider: serviceProvider.serviceProvider,
          countryCode,
          fiatCurrency: baseCurrencyInfo?.code.toLowerCase(),
          cryptoCurrency: quoteCurrency?.currencyInfo?.currency.symbol?.toLowerCase(),
        })
      }
      await openUri(widgetUrl).catch(onError)
      dispatchAddTransaction()
    }

    if (timeoutElapsed && !widgetLoading && widgetData) {
      navigateToWidget(widgetData.widgetUrl).catch(() => undefined)
    }
  }, [
    navigation,
    timeoutElapsed,
    widgetData,
    widgetLoading,
    widgetError,
    onError,
    dispatchAddTransaction,
    baseCurrencyInfo,
    serviceProvider,
    dispatch,
    externalTransactionId,
    quoteCurrency?.currencyInfo?.currency.symbol,
    quotesSections,
    countryCode,
  ])

  const isDarkMode = useIsDarkMode()
  const logoUrl = getServiceProviderLogo(serviceProvider?.logos, isDarkMode)

  return (
    <Screen>
      {baseCurrencyInfo && serviceProvider ? (
        <FiatOnRampConnectingView
          amount={addFiatSymbolToNumber({
            value: amount,
            currencyCode: baseCurrencyInfo?.code,
            currencySymbol: baseCurrencyInfo?.symbol,
          })}
          quoteCurrencyCode={quoteCurrency.currencyInfo?.currency.symbol}
          serviceProviderLogo={
            <Flex
              alignItems="center"
              height={SERVICE_PROVIDER_ICON_SIZE}
              justifyContent="center"
              width={SERVICE_PROVIDER_ICON_SIZE}>
              <ImageUri imageStyle={ServiceProviderLogoStyles.icon} uri={logoUrl} />
            </Flex>
          }
          serviceProviderName={serviceProvider.name}
        />
      ) : null}
    </Screen>
  )
}

const ServiceProviderLogoStyles = StyleSheet.create({
  icon: {
    height: SERVICE_PROVIDER_ICON_SIZE,
    width: SERVICE_PROVIDER_ICON_SIZE,
  },
})

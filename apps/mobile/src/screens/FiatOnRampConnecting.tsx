import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { skipToken } from '@reduxjs/toolkit/query/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { FiatOnRampConnectingView } from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { ServiceProviderLogoStyles } from 'src/features/fiatOnRamp/constants'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { getServiceProviderForQuote } from 'src/features/fiatOnRamp/utils'
import { closeModal } from 'src/features/modals/modalSlice'
import { FiatOnRampScreens } from 'src/screens/Screens'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { useFiatOnRampAggregatorWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { getOptionalServiceProviderLogo } from 'wallet/src/features/fiatOnRamp/utils'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'
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
    countryState,
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
    serviceProvider && quoteCurrency.meldCurrencyCode && baseCurrencyInfo && amount
      ? {
          serviceProvider: serviceProvider.serviceProvider,
          countryCode,
          destinationCurrencyCode: quoteCurrency.meldCurrencyCode,
          sourceAmount: amount,
          sourceCurrencyCode: baseCurrencyInfo.code,
          walletAddress: activeAccountAddress,
          externalSessionId: externalTransactionId,
          redirectUrl: `${uniswapUrls.redirectUrlBase}/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
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
        quoteCurrency?.meldCurrencyCode &&
        baseCurrencyInfo &&
        quotesSections?.[0]?.data?.[0]
      ) {
        sendWalletAnalyticsEvent(FiatOnRampEventName.FiatOnRampWidgetOpened, {
          externalTransactionId,
          serviceProvider: serviceProvider.serviceProvider,
          preselectedServiceProvider: quotesSections?.[0]?.data?.[0]?.serviceProvider,
          countryCode,
          countryState,
          fiatCurrency: baseCurrencyInfo?.code.toLowerCase(),
          cryptoCurrency: quoteCurrency.meldCurrencyCode.toLowerCase(),
        })
      }
      dispatchAddTransaction()
      await openUri(widgetUrl).catch(onError)
      dispatch(forceFetchFiatOnRampTransactions())
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
    quoteCurrency.meldCurrencyCode,
    quotesSections,
    countryCode,
    countryState,
  ])

  const isDarkMode = useIsDarkMode()
  const logoUrl = getOptionalServiceProviderLogo(serviceProvider?.logos, isDarkMode)

  return (
    <Screen>
      {baseCurrencyInfo && serviceProvider ? (
        <>
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
                height={ServiceProviderLogoStyles.icon.height}
                justifyContent="center"
                width={ServiceProviderLogoStyles.icon.width}>
                <ImageUri imageStyle={ServiceProviderLogoStyles.icon} uri={logoUrl} />
              </Flex>
            }
            serviceProviderName={serviceProvider.name}
          />
          <Text
            bottom={spacing.spacing8}
            color="$neutral3"
            position="absolute"
            px="$spacing24"
            textAlign="center"
            variant="body3">
            {t('fiatOnRamp.connection.terms', { serviceProvider: serviceProvider.name })}
          </Text>
        </>
      ) : null}
    </Screen>
  )
}

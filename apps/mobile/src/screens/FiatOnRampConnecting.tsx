import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { skipToken } from '@reduxjs/toolkit/query/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FiatOnRampConnectingView } from 'uniswap/src/features/fiatOnRamp/FiatOnRampConnectingView'
import { useFiatOnRampAggregatorWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { FiatOnRampEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'
import { FiatPurchaseTransactionInfo } from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

// Design decision
const CONNECTING_TIMEOUT = 2 * ONE_SECOND_MS

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.Connecting>

export function FiatOnRampConnectingScreen({ navigation }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { addFiatSymbolToNumber } = useLocalizationContext()
  const [timeoutElapsed, setTimeoutElapsed] = useState(false)
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { selectedQuote, quotesSections, countryCode, countryState, baseCurrencyInfo, quoteCurrency, amount } =
    useFiatOnRampContext()
  const serviceProvider = selectedQuote?.serviceProviderDetails

  const initialTypeInfo = useMemo<Partial<FiatPurchaseTransactionInfo>>(
    () => ({
      serviceProviderLogo: serviceProvider?.logos,
      serviceProvider: serviceProvider?.serviceProvider,
    }),
    [serviceProvider],
  )

  const { externalTransactionId, dispatchAddTransaction } = useFiatOnRampTransactionCreator(
    activeAccountAddress,
    quoteCurrency.currencyInfo?.currency.chainId ?? UniverseChainId.Mainnet,
    serviceProvider?.serviceProvider,
    initialTypeInfo,
  )

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('common.error.general'),
      }),
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
      : skipToken,
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
      if (serviceProvider && quoteCurrency?.meldCurrencyCode && baseCurrencyInfo && quotesSections?.[0]?.data?.[0]) {
        sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampWidgetOpened, {
          externalTransactionId,
          serviceProvider: serviceProvider.serviceProvider,
          preselectedServiceProvider: quotesSections?.[0]?.data?.[0]?.serviceProviderDetails.serviceProvider,
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
                width={ServiceProviderLogoStyles.icon.width}
              >
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
            variant="body3"
          >
            {t('fiatOnRamp.connection.terms', { serviceProvider: serviceProvider.name })}
          </Text>
        </>
      ) : null}
    </Screen>
  )
}

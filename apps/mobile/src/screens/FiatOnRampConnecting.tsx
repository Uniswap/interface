import { skipToken } from '@reduxjs/toolkit/query/react'
import React, { useCallback, useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Loader } from 'src/components/loading'
import { useTimeout } from 'utilities/src/time/timing'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import {
  FiatOnRampConnectingView,
  SERVICE_PROVIDER_ICON_SIZE,
} from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { getServiceProviderForQuote } from 'src/features/fiatOnRamp/meldUtils'
import { FiatOnRampScreens } from 'src/screens/Screens'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useFiatOnRampAggregatorWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
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

  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)
  const { selectedQuote, serviceProviders, countryCode, baseCurrencyInfo, quoteCurrency, amount } =
    useFiatOnRampContext()
  const serviceProvider = getServiceProviderForQuote(selectedQuote, serviceProviders)

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('Something went wrong.'),
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
          externalCustomerId: activeAccountAddress,
          externalSessionId: externalTransactionId,
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
    if (timeoutElapsed && !widgetLoading && widgetData) {
      navigation.goBack()
      openUri(widgetData.widgetUrl).catch(onError)
      // TODO: Uncomment this when https://linear.app/uniswap/issue/MOB-2585/implement-polling-of-transaction-once-user-has-checked-out is implmented
      // dispatchAddTransaction()
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
  ])

  return baseCurrencyInfo && serviceProvider ? (
    <FiatOnRampConnectingView
      amount={addFiatSymbolToNumber({
        value: amount,
        currencyCode: baseCurrencyInfo?.code,
        currencySymbol: baseCurrencyInfo?.symbol,
      })}
      quoteCurrencyCode={quoteCurrency.currencyInfo?.currency.symbol}
      serviceProviderLogo={
        <Loader.Box
          borderRadius="$rounded20"
          height={SERVICE_PROVIDER_ICON_SIZE}
          width={SERVICE_PROVIDER_ICON_SIZE}
        />
      }
      serviceProviderName={serviceProvider.name}
    />
  ) : null
}

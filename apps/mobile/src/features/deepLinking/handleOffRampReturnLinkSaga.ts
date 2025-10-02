import { Alert } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { dismissInAppBrowser } from 'src/utils/linking'
import { call, put } from 'typed-redux-saga'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOffRampMetaData, OffRampTransferDetailsResponse } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOffRampEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { forceFetchFiatOnRampTransactions } from 'uniswap/src/features/transactions/slice'
import i18n from 'uniswap/src/i18n'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'
import { fetchOffRampTransferDetails } from 'wallet/src/features/fiatOnRamp/api'

export function* handleOffRampReturnLink(url: URL) {
  try {
    yield* call(_handleOffRampReturnLink, url)
  } catch (_error) {
    Alert.alert(i18n.t('fiatOffRamp.error.populateSend.title'), i18n.t('fiatOffRamp.error.populateSend.description'))
  }
}

function* _handleOffRampReturnLink(url: URL) {
  const externalTransactionId = url.searchParams.get('externalTransactionId')
  const currencyCode = url.searchParams.get('baseCurrencyCode')
  const currencyAmount = url.searchParams.get('baseCurrencyAmount')
  const walletAddress = url.searchParams.get('depositWalletAddress')

  const hasValidMoonpayData = currencyCode && currencyAmount && walletAddress
  if (!externalTransactionId && !hasValidMoonpayData) {
    throw new Error('Missing externalTransactionId or moonpay data in fiat offramp deep link')
  }

  let offRampTransferDetails: OffRampTransferDetailsResponse | undefined

  try {
    offRampTransferDetails = yield* call(fetchOffRampTransferDetails, {
      sessionId: externalTransactionId,
      baseCurrencyCode: currencyCode,
      baseCurrencyAmount: Number(currencyAmount),
      depositWalletAddress: walletAddress,
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'handleOffRampReturnLinkSaga', function: 'handleOffRampReturnLink' },
      extra: { url: url.toString() },
    })
    throw new Error('Failed to fetch offramp transfer details')
  }

  if (
    !offRampTransferDetails.tokenAddress ||
    !offRampTransferDetails.baseCurrencyCode ||
    !offRampTransferDetails.depositWalletAddress ||
    !!offRampTransferDetails.errorCode
  ) {
    throw new Error('Missing offRampTransferDetails in fiat offramp deep link')
  }

  const { tokenAddress, baseCurrencyCode, baseCurrencyAmount, depositWalletAddress, logos, provider, chainId } =
    offRampTransferDetails

  const analyticsProperties = {
    cryptoCurrency: baseCurrencyCode,
    currencyAmount: baseCurrencyAmount,
    serviceProvider: provider,
    chainId,
    externalTransactionId,
  }

  sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampWidgetCompleted, analyticsProperties)

  const currencyTradeableAsset: TradeableAsset = {
    address: tokenAddress,
    chainId: Number(chainId) as UniverseChainId,
    type: AssetType.Currency,
  }

  const fiatOffRampMetaData: FiatOffRampMetaData = {
    name: provider,
    logoUrl: logos.lightLogo,
    onSubmitCallback: (amountUSD?: number) => {
      sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampFundsSent, { ...analyticsProperties, amountUSD })
    },
    moonpayCurrencyCode: baseCurrencyCode,
    meldCurrencyCode: baseCurrencyCode,
  }

  const txnId = createTransactionId()

  const initialSendState = {
    txId: txnId,
    [CurrencyField.INPUT]: currencyTradeableAsset,
    [CurrencyField.OUTPUT]: null,
    exactCurrencyField: CurrencyField.INPUT,
    exactAmountToken: baseCurrencyAmount.toString(),
    focusOnCurrencyField: null,
    recipient: depositWalletAddress,
    isFiatInput: false,
    showRecipientSelector: false,
    fiatOffRampMetaData,
    sendScreen: TransactionScreen.Review,
  }

  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, MobileScreens.Home)
  yield* put(openModal({ name: ModalName.Send, initialState: initialSendState }))
  yield* call(dismissInAppBrowser)
}

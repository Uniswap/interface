import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { call, put } from 'typed-redux-saga'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOffRampMetaData, OffRampTransferDetailsResponse } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { logger } from 'utilities/src/logger/logger'
import { fetchOffRampTransferDetails } from 'wallet/src/features/fiatOnRamp/api'
import { dismissInAppBrowser } from 'wallet/src/utils/linking'

export function* handleOffRampReturnLink(url: URL) {
  try {
    yield* call(_handleOffRampReturnLink, url)
  } catch (error) {
    // TODO: handle error in UI
    // Alert.alert(i18n.t('walletConnect.error.general.title'), i18n.t('walletConnect.error.general.message'))
    // yield* put(openModal({ name: ModalName.Send, initialState: initialSendState }))
  }
}

function* _handleOffRampReturnLink(url: URL) {
  const externalTransactionId = url.searchParams.get('externalTransactionId')

  if (!externalTransactionId) {
    throw new Error('Missing externalTransactionId in fiat offramp deep link')
  }

  let offRampTransferDetails: OffRampTransferDetailsResponse | undefined

  try {
    offRampTransferDetails = yield* call(fetchOffRampTransferDetails, externalTransactionId)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'handleOffRampReturnLinkSaga', function: 'handleOffRampReturnLink' },
    })
    throw new Error('Failed to fetch offramp transfer details')
  }

  if (!offRampTransferDetails) {
    throw new Error('Missing offRampTransferDetails in fiat offramp deep link')
  }

  const { tokenAddress, baseCurrencyCode, baseCurrencyAmount, depositWalletAddress, logos, provider, chainId } =
    offRampTransferDetails

  const currencyTradeableAsset: TradeableAsset = {
    address: tokenAddress,
    chainId: Number(chainId) as UniverseChainId,
    type: AssetType.Currency,
  }

  const fiatOffRampMetaData: FiatOffRampMetaData = {
    name: provider,
    logoUrl: logos.lightLogo,
    // TODO: update activity feed once transaction is submitted
    onSubmitCallback: () => {},
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

  yield* call(navigate, MobileScreens.Home)
  yield* put(openModal({ name: ModalName.Send, initialState: initialSendState }))
  yield* call(dismissInAppBrowser)
}

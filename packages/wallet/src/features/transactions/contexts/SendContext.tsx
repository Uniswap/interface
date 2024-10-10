import { TransactionRequest } from '@ethersproject/providers'
import { Currency } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'uniswap/src/components/modals/WarningModal/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType } from 'uniswap/src/entities/assets'
import { useTransactionGasFee, useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useFormattedWarnings } from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { ParsedWarnings } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useDerivedSendInfo } from 'wallet/src/features/transactions/send/hooks/useDerivedSendInfo'
import { useSendTransactionRequest } from 'wallet/src/features/transactions/send/hooks/useSendTransactionRequest'
import { useSendWarnings } from 'wallet/src/features/transactions/send/hooks/useSendWarnings'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export const getDefaultSendState = (defaultChainId: UniverseChainId): Readonly<TransactionState> => ({
  [CurrencyField.INPUT]: {
    address: getNativeAddress(defaultChainId),
    chainId: defaultChainId,
    type: AssetType.Currency,
  },
  [CurrencyField.OUTPUT]: null,
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  exactAmountToken: '',
  exactAmountFiat: '',
  isFiatInput: false,
  selectingCurrencyField: undefined,
  showRecipientSelector: true,
  customSlippageTolerance: undefined,
})

type SendContextState = {
  derivedSendInfo: ReturnType<typeof useDerivedSendInfo>
  gasFee: GasFeeResult
  warnings: ParsedWarnings
  txRequest: TransactionRequest | undefined
  onSelectCurrency: (currency: Currency, _currencyField: CurrencyField, _isBridgePair: boolean) => void
  updateSendForm: (newState: Partial<TransactionState>) => void
} & TransactionState

export const SendContext = createContext<SendContextState | undefined>(undefined)

export function SendContextProvider({
  prefilledTransactionState,
  children,
}: {
  prefilledTransactionState?: TransactionState
  children: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()
  const { defaultChainId } = useEnabledChains()
  const defaultSendState = getDefaultSendState(defaultChainId)

  // state
  const [sendForm, setSendForm] = useState<TransactionState>(prefilledTransactionState || defaultSendState)
  const updateSendForm = useCallback(
    (newState: Parameters<SendContextState['updateSendForm']>[0]): void => {
      setSendForm((prevState) => ({ ...prevState, ...newState }))
    },
    [setSendForm],
  )

  // derived info based on transfer state
  const derivedSendInfo = useDerivedSendInfo(sendForm)
  const warnings = useSendWarnings(t, derivedSendInfo)
  const txRequest = useSendTransactionRequest(derivedSendInfo)
  const gasFee = useTransactionGasFee(
    txRequest,
    warnings.some((warning) => warning.action === WarningAction.DisableReview),
  )
  const txRequestWithGasSettings = useMemo(
    (): providers.TransactionRequest => ({ ...txRequest, ...gasFee.params }),
    [gasFee.params, txRequest],
  )
  const gasWarning = useTransactionGasWarning({
    account,
    derivedInfo: derivedSendInfo,
    gasFee: gasFee?.value,
  })
  const allSendWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])
  const parsedSendWarnings = useFormattedWarnings(allSendWarnings)

  // helper function for currency selection
  const onSelectCurrency = useCallback(
    (currency: Currency, _currencyField: CurrencyField, _isBridgePair: boolean) => {
      updateSendForm({
        [CurrencyField.INPUT]: {
          address: currencyAddress(currency),
          chainId: currency.chainId,
          type: AssetType.Currency,
        },
        selectingCurrencyField: undefined,
      })
    },
    [updateSendForm],
  )

  const state: SendContextState = useMemo(() => {
    return {
      derivedSendInfo,
      gasFee,
      warnings: parsedSendWarnings,
      txRequest: txRequestWithGasSettings,
      onSelectCurrency,
      updateSendForm,
      txId: sendForm.txId,
      [CurrencyField.INPUT]: sendForm.input,
      [CurrencyField.OUTPUT]: sendForm.output,
      exactAmountToken: sendForm.exactAmountToken,
      exactAmountFiat: sendForm.exactAmountFiat,
      exactCurrencyField: sendForm.exactCurrencyField,
      focusOnCurrencyField: sendForm.focusOnCurrencyField,
      recipient: sendForm.recipient,
      isFiatInput: sendForm.isFiatInput,
      selectingCurrencyField: sendForm.selectingCurrencyField,
      showRecipientSelector: sendForm.showRecipientSelector,
      selectedProtocols: sendForm.selectedProtocols,
      customSlippageTolerance: sendForm.customSlippageTolerance,
    }
  }, [
    derivedSendInfo,
    gasFee,
    parsedSendWarnings,
    sendForm.customSlippageTolerance,
    sendForm.exactAmountFiat,
    sendForm.exactAmountToken,
    sendForm.exactCurrencyField,
    sendForm.focusOnCurrencyField,
    sendForm.input,
    sendForm.isFiatInput,
    sendForm.output,
    sendForm.recipient,
    sendForm.selectingCurrencyField,
    sendForm.showRecipientSelector,
    sendForm.selectedProtocols,
    sendForm.txId,
    txRequestWithGasSettings,
    onSelectCurrency,
    updateSendForm,
  ])
  return <SendContext.Provider value={state}>{children}</SendContext.Provider>
}

export const useSendContext = (): SendContextState => {
  const sendContext = useContext(SendContext)

  if (sendContext === undefined) {
    throw new Error('`useSendContext` must be used inside of `SendContextProvider`')
  }

  return sendContext
}

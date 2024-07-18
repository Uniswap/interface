import { TransactionRequest } from '@ethersproject/providers'
import { providers } from 'ethers'
import React, { createContext, ReactNode, useContext, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnyAction } from 'redux'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed } from 'wallet/src/features/gas/types'
import {
  ParsedWarnings,
  useParsedSendWarnings,
} from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'
import {
  INITIAL_TRANSACTION_STATE,
  transactionStateReducer,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { useDerivedTransferInfo } from 'wallet/src/features/transactions/transfer/hooks/useDerivedTransferInfo'
import { useTransferTransactionRequest } from 'wallet/src/features/transactions/transfer/hooks/useTransferTransactionRequest'
import { useTransferWarnings } from 'wallet/src/features/transactions/transfer/hooks/useTransferWarnings'
import { WarningAction } from 'wallet/src/features/transactions/WarningModal/types'

export enum TransferScreen {
  SendForm,
  SendReview,
}

export enum TransferEntryType {
  Fiat,
  Crypto,
}

type TransferContextState = {
  screen: TransferScreen
  setScreen: (newScreen: TransferScreen) => void
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: ReturnType<typeof useDerivedTransferInfo>
  gasFee: GasFeeResult
  warnings: ParsedWarnings
  txRequest: TransactionRequest | undefined
} & TransactionState

export const TransferContext = createContext<TransferContextState | undefined>(undefined)

export function TransferContextProvider({
  prefilledTransactionState,
  children,
}: {
  prefilledTransactionState?: TransactionState
  children: ReactNode
}): JSX.Element {
  const { t } = useTranslation()

  // state and reducers
  const [transferFormState, dispatch] = useReducer(transactionStateReducer, {
    ...(prefilledTransactionState ?? INITIAL_TRANSACTION_STATE),
    showRecipientSelector: false,
  })
  const [screen, setScreen] = useState<TransferScreen>(TransferScreen.SendForm)

  // derived info based on transfer state
  const derivedTransferInfo = useDerivedTransferInfo(transferFormState)

  const warnings = useTransferWarnings(t, derivedTransferInfo)

  const txRequest = useTransferTransactionRequest(derivedTransferInfo)

  const gasFee = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    warnings.some((warning) => warning.action === WarningAction.DisableReview),
  )

  const txRequestWithGasSettings = useMemo(
    (): providers.TransactionRequest => ({ ...txRequest, ...gasFee.params }),
    [gasFee.params, txRequest],
  )

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedTransferInfo,
    gasFee: gasFee?.value,
  })

  const allSendWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  const parsedSendWarnings = useParsedSendWarnings(allSendWarnings)

  const state: TransferContextState = useMemo(() => {
    return {
      derivedTransferInfo,
      screen,
      setScreen,
      dispatch,
      gasFee,
      warnings: parsedSendWarnings,
      txRequest: txRequestWithGasSettings,
      ...transferFormState,
    }
  }, [derivedTransferInfo, gasFee, parsedSendWarnings, screen, transferFormState, txRequestWithGasSettings])

  return <TransferContext.Provider value={state}>{children}</TransferContext.Provider>
}

export const useTransferContext = (): TransferContextState => {
  const transferContext = useContext(TransferContext)

  if (transferContext === undefined) {
    throw new Error('`useTransferContext` must be used inside of `TransferContextProvider`')
  }

  return transferContext
}

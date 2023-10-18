import { AnyAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import { Dispatch } from 'react'
import { Warning } from 'src/components/modals/WarningModal/types'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { DerivedSwapInfo } from './swap/types'

export enum TransactionStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

export interface TransactionFlowProps {
  dispatch: Dispatch<AnyAction>
  showRecipientSelector?: boolean
  recipientSelector?: JSX.Element
  flowName: string
  derivedInfo: DerivedTransferInfo | DerivedSwapInfo
  onClose: () => void
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  step: TransactionStep
  setStep: (newStep: TransactionStep) => void
  warnings: Warning[]
  exactValue: string
  isFiatInput?: boolean
  showFiatToggle?: boolean
}

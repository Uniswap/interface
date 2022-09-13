import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/modals/types'
import { useTransactionGasFee } from 'src/features/gas/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'src/features/transactions/transfer/hooks'
import { useTransferTransactionRequest } from 'src/features/transactions/transfer/useTransferTransactionRequest'
import { TransferDetails } from 'src/features/transactions/transfer/TransferDetails'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferFormProps {
  state: TransactionState
  derivedTransferInfo: DerivedTransferInfo
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
}

export function TransferReview({ derivedTransferInfo, state, onNext, onPrev }: TransferFormProps) {
  const { t } = useTranslation()

  const {
    currencyAmounts,
    formattedAmounts,
    recipient,
    isUSDInput = false,
    warnings,
    currencyIn,
    nftIn,
    chainId,
  } = derivedTransferInfo
  const { txId } = state

  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const gasFeeInfo = useTransactionGasFee(txRequest)
  const transferTxWithGasSettings = gasFeeInfo ? { ...txRequest, ...gasFeeInfo.params } : txRequest

  // TODO: how should we surface this warning?
  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) || !gasFeeInfo

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyIn ? currencyAddress(currencyIn) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    transferTxWithGasSettings,
    onNext
  )
  // TODO: if readonly account, not sendable
  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.asset_contract.address,
    nftIn?.token_id,
    transferTxWithGasSettings,
    onNext
  )

  const submitCallback = () => {
    onNext()
    nftIn ? transferNFTCallback?.() : transferERC20Callback?.()
  }

  if (!recipient) return null

  const actionButtonProps = {
    disabled: actionButtonDisabled,
    label: t('Send'),
    name: ElementName.Send,
    onPress: submitCallback,
  }

  return (
    <TransactionReview
      actionButtonProps={actionButtonProps}
      currencyIn={currencyIn}
      formattedAmountIn={formattedAmounts[CurrencyField.INPUT]}
      isUSDInput={isUSDInput}
      nftIn={nftIn}
      recipient={recipient}
      transactionDetails={<TransferDetails chainId={chainId} gasFee={gasFeeInfo?.gasFee} />}
      onPrev={onPrev}
    />
  )
}

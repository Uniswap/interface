import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/warnings/types'
import { ElementName } from 'src/features/telemetry/constants'
import { GasSpeed } from 'src/features/transactions/swap/hooks'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferGasFee,
  useTransferNFTCallback,
  useUpdateTransferGasEstimate,
} from 'src/features/transactions/transfer/hooks'
import { TransferDetails } from 'src/features/transactions/transfer/TransferDetails'
import { InputAssetInfo } from 'src/features/transactions/transfer/types'
import { TransactionType } from 'src/features/transactions/types'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferFormProps {
  state: TransactionState
  derivedTransferInfo: DerivedTransferInfo
  inputAssetInfo: InputAssetInfo
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
}

export function TransferReview({
  derivedTransferInfo,
  inputAssetInfo,
  state,
  dispatch,
  onNext,
  onPrev,
}: TransferFormProps) {
  const { t } = useTranslation()

  const {
    currencyAmounts,
    currencyTypes,
    formattedAmounts,
    recipient,
    isUSDInput = false,
    warnings,
  } = derivedTransferInfo
  const { currencyIn, nftIn, chainId } = inputAssetInfo
  const { gasFeeEstimate, txId, optimismL1Fee } = state

  // TODO: how should we surface this warning?
  const actionButtonDisabled = warnings.some(
    (warning) => warning.action === WarningAction.DisableReview
  )

  // if action button is disabled, make amount undefined so that gas estimate doesn't run
  useUpdateTransferGasEstimate(
    dispatch,
    chainId,
    nftIn ? nftIn.asset_contract.address : currencyIn ? currencyAddress(currencyIn) : undefined,
    !actionButtonDisabled ? currencyAmounts[CurrencyField.INPUT]?.quotient.toString() : undefined,
    recipient,
    nftIn?.token_id,
    currencyTypes[CurrencyField.INPUT]
  )

  const feeInfo = gasFeeEstimate?.[TransactionType.Send]
  const gasFee = useTransferGasFee(gasFeeEstimate, GasSpeed.Urgent, optimismL1Fee)

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyIn ? currencyAddress(currencyIn) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    feeInfo,
    onNext
  )
  // TODO: if readonly account, not sendable
  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.asset_contract.address,
    nftIn?.token_id,
    feeInfo,
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
      transactionDetails={<TransferDetails chainId={chainId} gasFee={gasFee} />}
      onPrev={onPrev}
    />
  )
}

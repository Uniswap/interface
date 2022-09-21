import { providers } from 'ethers'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/modals/types'
import { TransactionGasFeeInfo } from 'src/features/gas/types'
import { ElementName } from 'src/features/telemetry/constants'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'src/features/transactions/transfer/hooks'
import { TransferDetails } from 'src/features/transactions/transfer/TransferDetails'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferFormProps {
  derivedTransferInfo: DerivedTransferInfo
  txRequest?: providers.TransactionRequest
  gasFeeInfo?: TransactionGasFeeInfo
  onNext: () => void
  onPrev: () => void
}

export function TransferReview({
  derivedTransferInfo,
  gasFeeInfo,
  onNext,
  onPrev,
  txRequest,
}: TransferFormProps) {
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
    txId,
  } = derivedTransferInfo

  const transferTxWithGasSettings = gasFeeInfo ? { ...txRequest, ...gasFeeInfo.params } : txRequest

  // TODO: how should we surface this warning?
  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    !gasFeeInfo ||
    !txRequest

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

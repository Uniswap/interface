import { providers } from 'ethers'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction } from 'src/components/modals/WarningModal/types'
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
  totalGasFee?: string
  onNext: () => void
  onPrev: () => void
  warnings: Warning[]
}

export function TransferReview({
  derivedTransferInfo,
  totalGasFee,
  onNext,
  onPrev,
  txRequest,
  warnings,
}: TransferFormProps) {
  const { t } = useTranslation()

  const {
    currencyAmounts,
    formattedAmounts,
    recipient,
    isUSDInput = false,
    currencyIn,
    nftIn,
    chainId,
    txId,
  } = derivedTransferInfo

  // TODO: how should we surface this warning?
  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    !totalGasFee ||
    !txRequest

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyIn ? currencyAddress(currencyIn) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onNext
  )
  // TODO: if readonly account, not sendable
  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.asset_contract.address,
    nftIn?.token_id,
    txRequest,
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
      transactionDetails={<TransferDetails chainId={chainId} gasFee={totalGasFee} />}
      onPrev={onPrev}
    />
  )
}

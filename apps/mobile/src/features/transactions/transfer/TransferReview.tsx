import { providers } from 'ethers'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { NetworkFeeInfoModal } from 'src/features/transactions/swap/modals/NetworkFeeInfoModal'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import {
  DerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'src/features/transactions/transfer/hooks'
import { NumberType } from 'utilities/src/format/types'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useUSDCValue } from 'wallet/src/features/routing/useUSDCPrice'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { currencyAddress } from 'wallet/src/utils/currencyId'

interface TransferFormProps {
  derivedTransferInfo: DerivedTransferInfo
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  onNext: () => void
  onPrev: () => void
  warnings: Warning[]
}

export function TransferReview({
  derivedTransferInfo,
  gasFee,
  onNext,
  onPrev,
  txRequest,
  warnings,
}: TransferFormProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatCurrencyAmount, formatNumberOrString } = useLocalizationContext()
  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showNetworkFeeInfoModal, setShowNetworkFeeInfoModal] = useState(false)
  const currency = useAppFiatCurrencyInfo()

  const onShowWarning = (): void => {
    setShowWarningModal(true)
  }

  const onCloseWarning = (): void => {
    setShowWarningModal(false)
  }

  const onShowNetworkFeeInfo = (): void => {
    setShowNetworkFeeInfoModal(true)
  }

  const onCloseNetworkFeeInfo = (): void => {
    setShowNetworkFeeInfoModal(false)
  }

  const {
    currencyAmounts,
    recipient,
    isFiatInput = false,
    currencyInInfo,
    nftIn,
    chainId,
    txId,
    exactAmountFiat,
  } = derivedTransferInfo

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )

  const actionButtonDisabled =
    blockingWarning ||
    !gasFee.value ||
    !!gasFee.error ||
    !txRequest ||
    account.type === AccountType.Readonly

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onNext
  )

  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onNext
  )

  const submitCallback = (): void => {
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

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  const formattedCurrencyAmount = formatCurrencyAmount({
    value: currencyAmounts[CurrencyField.INPUT],
    type: NumberType.TokenTx,
  })
  const formattedAmountIn = isFiatInput
    ? formatNumberOrString({
        value: exactAmountFiat,
        type: NumberType.FiatTokenQuantity,
        currencyCode: currency.code,
      })
    : formattedCurrencyAmount

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          closeText={blockingWarning ? undefined : t('Cancel')}
          confirmText={blockingWarning ? t('OK') : t('Confirm')}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onCancel={onCloseWarning}
          onClose={onCloseWarning}
          onConfirm={onCloseWarning}
        />
      )}
      {showNetworkFeeInfoModal && <NetworkFeeInfoModal onClose={onCloseNetworkFeeInfo} />}
      <TransactionReview
        actionButtonProps={actionButtonProps}
        currencyInInfo={currencyInInfo}
        formattedAmountIn={formattedAmountIn}
        inputCurrencyUSDValue={inputCurrencyUSDValue}
        isFiatInput={isFiatInput}
        nftIn={nftIn}
        recipient={recipient}
        transactionDetails={
          <TransactionDetails
            chainId={chainId}
            gasFee={gasFee}
            showWarning={Boolean(transferWarning)}
            warning={transferWarning}
            onShowNetworkFeeInfo={onShowNetworkFeeInfo}
            onShowWarning={onShowWarning}
          />
        }
        usdTokenEquivalentAmount={formattedCurrencyAmount}
        onPrev={onPrev}
      />
    </>
  )
}

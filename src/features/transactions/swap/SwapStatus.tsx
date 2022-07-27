import { TradeType } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChainId } from 'src/constants/chains'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { useSelectTransactionById } from 'src/features/transactions/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { getInputAmountFromTrade, getOutputAmountFromTrade } from 'src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { toSupportedChainId } from 'src/utils/chainId'

type SwapStatusProps = {
  derivedSwapInfo: DerivedSwapInfo
  onNext: () => void
  onTryAgain: () => void
}

const getTextFromSwapStatus = (
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
) => {
  if (!transactionDetails || transactionDetails.typeInfo.type !== TransactionType.Swap) {
    // TODO: should never go into this state but should probably do some
    // error display here
    return {
      title: t('Swap pending'),
      description: t(
        'We’ll notify you once your swap is complete. You can now safely leave this page.'
      ),
    }
  }
  const status = transactionDetails.status

  if (status === TransactionStatus.Success) {
    const { typeInfo } = transactionDetails
    const { currencies } = derivedSwapInfo

    const inputCurrencyAmountRaw = getInputAmountFromTrade(typeInfo)
    const outputCurrencyAmountRaw = getOutputAmountFromTrade(typeInfo)

    const inputCurrency = currencies[CurrencyField.INPUT]
    const outputCurrency = currencies[CurrencyField.OUTPUT]

    const inputAmount = getFormattedCurrencyAmount(
      inputCurrency,
      inputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_OUTPUT
    )

    const outputAmount = getFormattedCurrencyAmount(
      outputCurrency,
      outputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_INPUT
    )

    return {
      title: t('Swap successful!'),
      description: t(
        'You swapped {{ inputAmount }}{{ inputCurrency }} for {{ outputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: inputCurrency?.symbol,
          outputAmount,
          outputCurrency: outputCurrency?.symbol,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Swap failed'),
      description: t('Keep in mind that the network fee is still charged for failed swaps.'),
    }
  }

  // TODO: handle TransactionStatus.Unknown state
  return {
    title: t('Swap pending'),
    description: t(
      'We’ll notify you once your swap is complete. You can now safely leave this page.'
    ),
  }
}

export function SwapStatus({ derivedSwapInfo, onNext, onTryAgain }: SwapStatusProps) {
  const { t } = useTranslation()
  const { txId, currencies } = derivedSwapInfo
  const chainId = toSupportedChainId(currencies[CurrencyField.INPUT]?.chainId) ?? ChainId.Mainnet
  const activeAddress = useActiveAccountAddressWithThrow()
  const transaction = useSelectTransactionById(activeAddress, chainId, txId)

  const { title, description } = useMemo(() => {
    return getTextFromSwapStatus(t, derivedSwapInfo, transaction)
  }, [t, transaction, derivedSwapInfo])

  return (
    <TransactionPending
      chainId={chainId}
      description={description}
      title={title}
      transaction={transaction}
      onNext={onNext}
      onTryAgain={onTryAgain}
    />
  )
}

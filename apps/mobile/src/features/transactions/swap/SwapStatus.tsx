import { TradeType } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelectTransaction } from 'src/features/transactions/hooks'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { AppTFunction } from 'ui/src/i18n/types'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { getInputAmountFromTrade } from 'wallet/src/features/transactions/getInputAmountFromTrade'
import { getOutputAmountFromTrade } from 'wallet/src/features/transactions/getOutputAmountFromTrade'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'
import { DerivedSwapInfo } from './types'

type SwapStatusProps = {
  derivedSwapInfo: DerivedSwapInfo
  onNext: () => void
  onTryAgain: () => void
}

type SwapStatusText = {
  title: string
  description: string
}

const getTextFromTxStatus = (
  t: AppTFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  if (derivedSwapInfo.wrapType === WrapType.NotApplicable) {
    return getTextFromSwapStatus(t, derivedSwapInfo, transactionDetails)
  }

  return getTextFromWrapStatus(t, derivedSwapInfo, transactionDetails)
}

const getTextFromWrapStatus = (
  t: AppTFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  const { wrapType } = derivedSwapInfo

  // transactionDetails may not been added to the store yet
  if (!transactionDetails || transactionDetails.status === TransactionStatus.Pending) {
    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap pending'),
        description: t('We’ll notify you once your unwrap is complete.'),
      }
    }

    return {
      title: t('Wrap pending'),
      description: t('We’ll notify you once your wrap is complete.'),
    }
  }

  if (transactionDetails.typeInfo.type !== TransactionType.Wrap) {
    throw new Error('input to getTextFromWrapStatus must be a wrap transaction type')
  }

  const status = transactionDetails.status
  if (status === TransactionStatus.Success) {
    const { typeInfo } = transactionDetails
    const { currencies } = derivedSwapInfo

    // input and output amounts are the same for wraps/unwraps
    const inputAmount = getFormattedCurrencyAmount(
      currencies[CurrencyField.INPUT]?.currency,
      typeInfo.currencyAmountRaw
    )

    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap successful!'),
        description: t(
          'You unwrapped {{ inputAmount }}{{ inputCurrency }} for {{ inputAmount }}{{ outputCurrency }}.',
          {
            inputAmount,
            inputCurrency: currencies[CurrencyField.INPUT]?.currency.symbol,
            outputCurrency: currencies[CurrencyField.OUTPUT]?.currency.symbol,
          }
        ),
      }
    }

    return {
      title: t('Wrap successful!'),
      description: t(
        'You wrapped {{ inputAmount }}{{ inputCurrency }} for {{ inputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: currencies[CurrencyField.INPUT]?.currency.symbol,
          outputCurrency: currencies[CurrencyField.OUTPUT]?.currency.symbol,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    if (wrapType === WrapType.Unwrap) {
      return {
        title: t('Unwrap failed'),
        description: t('Keep in mind that the network fee is still charged for failed unwraps.'),
      }
    }

    return {
      title: t('Wrap failed'),
      description: t('Keep in mind that the network fee is still charged for failed wraps.'),
    }
  }

  throw new Error('wrap transaction status is in an unhandled state')
}

const getTextFromSwapStatus = (
  t: AppTFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails
): SwapStatusText => {
  // transactionDetails may not been added to the store yet
  if (!transactionDetails || transactionDetails.status === TransactionStatus.Pending) {
    return {
      title: t('Swap pending'),
      description: t('We’ll notify you once your swap is complete.'),
    }
  }

  if (transactionDetails.typeInfo.type !== TransactionType.Swap) {
    throw new Error('input to getTextFromSwapStatus must be a swap transaction type')
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
      inputCurrency?.currency,
      inputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_OUTPUT
    )

    const outputAmount = getFormattedCurrencyAmount(
      outputCurrency?.currency,
      outputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_INPUT
    )

    return {
      title: t('Swap successful!'),
      description: t(
        'You swapped {{ inputAmount }}{{ inputCurrency }} for {{ outputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: getSymbolDisplayText(inputCurrency?.currency.symbol),
          outputAmount,
          outputCurrency: getSymbolDisplayText(outputCurrency?.currency.symbol),
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

  throw new Error('swap transaction status is in an unhandled state')
}

export function SwapStatus({ derivedSwapInfo, onNext, onTryAgain }: SwapStatusProps): JSX.Element {
  const { t } = useTranslation()
  const { txId, currencies } = derivedSwapInfo
  const chainId =
    toSupportedChainId(currencies[CurrencyField.INPUT]?.currency.chainId) ?? ChainId.Mainnet
  const activeAddress = useActiveAccountAddressWithThrow()
  const transaction = useSelectTransaction(activeAddress, chainId, txId)

  const { title, description } = useMemo(() => {
    return getTextFromTxStatus(t, derivedSwapInfo, transaction)
  }, [t, transaction, derivedSwapInfo])

  return (
    <TransactionPending
      chainId={chainId}
      description={description}
      title={title}
      transaction={transaction}
      transactionType="swap"
      onNext={onNext}
      onTryAgain={onTryAgain}
    />
  )
}

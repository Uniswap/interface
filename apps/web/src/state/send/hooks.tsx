import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import useENSAddress from 'hooks/useENSAddress'
import useENSName from 'hooks/useENSName'
import { GasFeeResult, GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { SendState } from 'state/send/SendContext'
import { useUnitagByAddress, useUnitagByName } from 'uniswap/src/features/unitags/hooks'
import { isAddress } from 'utilities/src/addresses'
import { useCreateTransferTransaction } from 'utils/transfer'

export interface RecipientData {
  address: string
  ensName?: string
  unitag?: string
}

export enum SendInputError {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_FUNDS_FOR_GAS = 'INSUFFICIENT_FUNDS_FOR_GAS',
}

export type SendInfo = {
  currencyBalance?: CurrencyAmount<Currency>
  parsedTokenAmount?: CurrencyAmount<Currency>
  exactAmountOut?: string
  recipientData?: RecipientData
  transaction?: TransactionRequest
  gasFee?: GasFeeResult
  gasFeeCurrencyAmount?: CurrencyAmount<Currency>
  inputError?: SendInputError
}

export function useDerivedSendInfo(state: SendState): SendInfo {
  const { account, chainId, provider } = useWeb3React()
  const { exactAmountToken, exactAmountFiat, inputInFiat, inputCurrency, recipient, validatedRecipientData } = state

  const { unitag: recipientInputUnitag } = useUnitagByName(validatedRecipientData ? undefined : recipient)
  const recipientInputUnitagUsername = validatedRecipientData?.unitag ?? recipientInputUnitag?.username
  const recipientInputUnitagAddress = recipientInputUnitag?.address?.address
  const { address: recipientInputEnsAddress } = useENSAddress(validatedRecipientData ? undefined : recipient)
  const validatedRecipientAddress = useMemo(() => {
    if (validatedRecipientData) {
      return validatedRecipientData.address
    }
    return (
      isAddress(recipient) || isAddress(recipientInputEnsAddress) || isAddress(recipientInputUnitagAddress) || undefined
    )
  }, [recipient, recipientInputEnsAddress, recipientInputUnitagAddress, validatedRecipientData])

  const { unitag } = useUnitagByAddress(recipientInputUnitagUsername ? undefined : validatedRecipientAddress)
  const { ENSName } = useENSName(validatedRecipientData?.ensName ? undefined : validatedRecipientAddress)
  const recipientData = useMemo(() => {
    if (validatedRecipientAddress) {
      return {
        address: validatedRecipientAddress,
        ensName: recipientInputEnsAddress ? recipient : validatedRecipientData?.ensName ?? ENSName ?? undefined,
        unitag: recipientInputUnitagUsername ?? unitag?.username,
      }
    }

    return undefined
  }, [
    validatedRecipientAddress,
    recipientInputEnsAddress,
    recipient,
    validatedRecipientData?.ensName,
    ENSName,
    recipientInputUnitagUsername,
    unitag?.username,
  ])

  const nativeCurrency = useCurrency(NATIVE_CHAIN_ID)
  const [inputCurrencyBalance, nativeCurencyBalance] = useCurrencyBalances(
    account,
    useMemo(() => [inputCurrency, nativeCurrency], [inputCurrency, nativeCurrency])
  )

  const exactAmountOut = useUSDTokenUpdater(inputInFiat, exactAmountToken ?? exactAmountFiat, inputCurrency)
  const parsedTokenAmount = useMemo(() => {
    return tryParseCurrencyAmount(inputInFiat ? exactAmountOut : exactAmountToken, inputCurrency)
  }, [exactAmountOut, exactAmountToken, inputCurrency, inputInFiat])

  const transferInfo = useMemo(() => {
    return {
      provider,
      account,
      chainId,
      currencyAmount: parsedTokenAmount,
      toAddress: recipientData?.address,
    }
  }, [account, chainId, parsedTokenAmount, provider, recipientData?.address])
  const transferTransaction = useCreateTransferTransaction(transferInfo)
  const gasFee = useTransactionGasFee(transferTransaction, GasSpeed.Normal, !transferTransaction)
  const gasFeeCurrencyAmount = useMemo(() => {
    if (!chainId || !gasFee?.value) {
      return undefined
    }

    return CurrencyAmount.fromRawAmount(nativeOnChain(chainId), gasFee.value)
  }, [chainId, gasFee?.value])

  const inputError = useMemo(() => {
    const insufficientBalance = parsedTokenAmount && inputCurrencyBalance?.lessThan(parsedTokenAmount)
    if (insufficientBalance) {
      return SendInputError.INSUFFICIENT_FUNDS
    }

    if (!gasFee.value || !nativeCurrency || !nativeCurencyBalance) {
      return undefined
    }

    let totalAmount = CurrencyAmount.fromRawAmount(nativeCurrency, gasFee?.value)
    if (parsedTokenAmount && inputCurrency && nativeCurrency?.equals(inputCurrency)) {
      totalAmount = totalAmount?.add(parsedTokenAmount)
    }

    if (!totalAmount || nativeCurencyBalance?.lessThan(totalAmount)) {
      return SendInputError.INSUFFICIENT_FUNDS_FOR_GAS
    }

    return undefined
  }, [gasFee.value, inputCurrency, inputCurrencyBalance, nativeCurencyBalance, nativeCurrency, parsedTokenAmount])

  return useMemo(
    () => ({
      currencyBalance: inputCurrencyBalance,
      exactAmountOut,
      parsedTokenAmount,
      recipientData,
      transaction: transferTransaction,
      gasFeeCurrencyAmount,
      gasFee,
      inputError,
    }),
    [
      exactAmountOut,
      gasFeeCurrencyAmount,
      gasFee,
      inputCurrencyBalance,
      inputError,
      parsedTokenAmount,
      recipientData,
      transferTransaction,
    ]
  )
}

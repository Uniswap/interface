import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Contract, providers } from 'ethers'
import { CallEffect } from 'redux-saga/effects'
import { Weth } from 'src/abis/types'
import WETH_ABI from 'src/abis/weth.json'
import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import {
  TransactionOptions,
  TransactionType,
  TransactionTypeInfo,
} from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export enum WrapType {
  NotApplicable,
  Wrap,
  Unwrap,
}

export type Params = {
  txId?: string
  txRequest: providers.TransactionRequest
  account: Account
  inputCurrencyAmount: CurrencyAmount<Currency>
}

export async function getWethContract(
  chainId: ChainId,
  provider: providers.Provider
): Promise<Weth> {
  return new Contract(WRAPPED_NATIVE_CURRENCY[chainId].address, WETH_ABI, provider) as Weth
}

export function* wrap(params: Params): Generator<
  CallEffect<{
    transactionResponse: providers.TransactionResponse
  }>,
  void,
  unknown
> {
  const { account, inputCurrencyAmount, txRequest, txId } = params
  let typeInfo: TransactionTypeInfo

  if (inputCurrencyAmount.currency.isNative) {
    typeInfo = {
      type: TransactionType.Wrap,
      unwrapped: false,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    }
  } else {
    typeInfo = {
      type: TransactionType.Wrap,
      unwrapped: true,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    }
  }

  const options: TransactionOptions = {
    request: txRequest,
  }

  yield* call(sendTransaction, {
    txId,
    chainId: inputCurrencyAmount.currency.chainId,
    account,
    options,
    typeInfo,
  })
}

export const {
  name: tokenWrapSagaName,
  wrappedSaga: tokenWrapSaga,
  reducer: tokenWrapReducer,
  actions: tokenWrapActions,
} = createMonitoredSaga<Params>(wrap, 'wrap')

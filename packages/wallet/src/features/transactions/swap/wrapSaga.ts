import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Contract, providers } from 'ethers'
import { call } from 'typed-redux-saga'
import { Weth } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { logger } from 'utilities/src/logger/logger'
import { getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import {
  TransactionOptions,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type WrapParams = {
  txId?: string
  txRequest: providers.TransactionRequest
  account: Account
  inputCurrencyAmount: CurrencyAmount<Currency>
}

export async function getWethContract(
  chainId: ChainId,
  provider: providers.Provider
): Promise<Weth> {
  return new Contract(getWrappedNativeAddress(chainId), WETH_ABI, provider) as Weth
}

export function* wrap(params: WrapParams) {
  try {
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
  } catch (error) {
    logger.error(error, { tags: { file: 'wrapSaga', function: 'wrap' } })
  }
}

export const {
  name: tokenWrapSagaName,
  wrappedSaga: tokenWrapSaga,
  reducer: tokenWrapReducer,
  actions: tokenWrapActions,
} = createMonitoredSaga<WrapParams>(wrap, 'wrap')

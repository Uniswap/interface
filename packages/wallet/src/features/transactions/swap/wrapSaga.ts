import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Contract, providers } from 'ethers'
import { call } from 'typed-redux-saga'
import { Weth } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { TransactionOptions, TransactionType, TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type WrapParams = {
  txId?: string
  // The id that will be used for the swap submitted after the wrap, if applicable.
  swapTxId?: string
  txRequest: providers.TransactionRequest
  account: AccountMeta
  inputCurrencyAmount: CurrencyAmount<Currency>
}

export async function getWethContract(chainId: WalletChainId, provider: providers.Provider): Promise<Weth> {
  return new Contract(getWrappedNativeAddress(chainId), WETH_ABI, provider) as Weth
}

export function* wrap(params: WrapParams) {
  try {
    const { account, inputCurrencyAmount, txRequest, txId, swapTxId } = params
    let typeInfo: TransactionTypeInfo

    if (inputCurrencyAmount.currency.isNative) {
      typeInfo = {
        type: TransactionType.Wrap,
        unwrapped: false,
        currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
        swapTxId,
      }
    } else {
      typeInfo = {
        type: TransactionType.Wrap,
        unwrapped: true,
        currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
        swapTxId,
      }
    }

    const options: TransactionOptions = {
      request: txRequest,
    }

    return yield* call(sendTransaction, {
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

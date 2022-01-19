import { Currency, CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import { Contract, PopulatedTransaction, providers } from 'ethers'
import { Weth } from 'src/abis/types'
import WETH_ABI from 'src/abis/weth.json'
import { getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
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
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

export type Params = {
  account: Account
  inputCurrencyAmount: CurrencyAmount<Currency>
}

export async function getWethContract(
  chainId: ChainId,
  provider: providers.Provider
): Promise<Weth> {
  return new Contract(WETH9[chainId].address, WETH_ABI, provider) as Weth
}

export function* wrap(params: Params) {
  const { account, inputCurrencyAmount } = params
  const { chainId } = inputCurrencyAmount.currency

  const providerManager = yield* call(getWalletProviders)
  const provider = providerManager.getProvider(chainId)
  // TODO(#303): use contract manager to cache contract
  const connectedWethContract = yield* call(getWethContract, chainId, provider)

  let request: PopulatedTransaction
  let typeInfo: TransactionTypeInfo

  if (inputCurrencyAmount.currency.isNative) {
    request = yield* call(connectedWethContract.populateTransaction.deposit, {
      value: `0x${inputCurrencyAmount.quotient.toString(16)}`,
    })

    typeInfo = {
      type: TransactionType.WRAP,
      unwrapped: false,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    }
  } else {
    request = yield* call(
      connectedWethContract.populateTransaction.withdraw,
      `0x${inputCurrencyAmount.quotient.toString(16)}`
    )

    typeInfo = {
      type: TransactionType.WRAP,
      unwrapped: true,
      currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
    }
  }

  const options: TransactionOptions = {
    request,
    fetchBalanceOnSuccess: true,
  }

  yield* call(sendTransaction, {
    chainId,
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

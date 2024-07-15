import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { WrapParams, tokenWrapActions } from 'wallet/src/features/transactions/swap/wrapSaga'
import { WrapType } from 'wallet/src/features/transactions/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType,
  onSuccess: () => void,
  txRequest?: providers.TransactionRequest,
  txId?: string
): {
  wrapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  return useMemo(() => {
    if (!isWrapAction(wrapType)) {
      return {
        wrapCallback: (): void =>
          logger.error(new Error('Attempted wrap on a non-wrap transaction'), {
            tags: {
              file: 'swap/hooks',
              function: 'useWrapCallback',
            },
          }),
      }
    }

    if (!account || !inputCurrencyAmount || !txRequest) {
      return {
        wrapCallback: (): void =>
          logger.error(new Error('Attempted wrap with missing required parameters'), {
            tags: {
              file: 'swap/hooks',
              function: 'useWrapCallback',
            },
            extra: { account, inputCurrencyAmount, txRequest },
          }),
      }
    }

    return {
      wrapCallback: (): void => {
        const params: WrapParams = {
          account,
          inputCurrencyAmount,
          txId,
          txRequest,
        }

        appDispatch(tokenWrapActions.trigger(params))
        onSuccess()
      },
    }
  }, [txId, account, appDispatch, inputCurrencyAmount, wrapType, txRequest, onSuccess])
}

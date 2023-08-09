import { providers } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { useGasFeeQuery } from 'wallet/src/features/gas/api'
import { FeeType, GasSpeed, TransactionGasFeeInfo } from 'wallet/src/features/gas/types'
import { useUSDCValue } from 'wallet/src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useTransactionGasFee(
  tx: Maybe<providers.TransactionRequest>,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean
): TransactionGasFeeInfo | undefined {
  // TODO: [MOB-650] Handle error responses from gas endpoint

  // TODO: remove this when we merge latest version of gas endpoint
  // https://linear.app/uniswap/issue/MOB-1069/remove-chain-override-in-gas-endpoint-for-base
  // if (tx?.chainId === ChainId.Base) {
  //   tx.chainId = ChainId.Optimism
  // }

  const { data } = useGasFeeQuery(tx, skip)

  return useMemo(() => {
    if (!data) return undefined

    const params =
      data.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: data.maxPriorityFeePerGas[speed],
            maxFeePerGas: data.maxFeePerGas[speed],
            gasLimit: data.gasLimit,
          }
        : {
            gasPrice: data.gasPrice[speed],
            gasLimit: data.gasLimit,
          }

    return {
      type: data.type,
      speed,
      gasFee: data.gasFee[speed],
      params,
    }
  }, [data, speed])
}

export function useUSDValue(chainId?: ChainId, ethValueInWei?: string): string | undefined {
  const currencyAmount = getCurrencyAmount({
    value: ethValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })

  return useUSDCValue(currencyAmount)?.toExact()
}

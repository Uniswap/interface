import { skipToken } from '@reduxjs/toolkit/dist/query'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { GAS_FEE_REFRESH_INTERVAL } from 'src/constants/gas'
import { PollingInterval } from 'src/constants/misc'
import {
  TRANSACTION_CANCELLATION_GAS_FACTOR,
  TRANSACTION_MINIMUM_GAS,
} from 'src/constants/transactions'
import { getAdjustedGasFeeParams } from 'src/features/gas/adjustGasFee'
import { useGasFeeQuery } from 'src/features/gas/api'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { FeeInfo, FeeType, GasSpeed, TransactionGasFeeInfo } from 'src/features/gas/types'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { TransactionDetails } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { useInterval } from 'src/utils/timing'

export function useTransactionGasFee(
  tx: providers.TransactionRequest | null,
  speed: GasSpeed
): TransactionGasFeeInfo | undefined {
  // TODO: Handle error responses from gas endpoint
  const { currentData } = useGasFeeQuery(tx ?? skipToken, {
    // poll new gas fees around every block time
    // TODO: use faster speed for Polygon, which has around ~3s block times
    pollingInterval: PollingInterval.Fast,
  })

  return useMemo(() => {
    if (!currentData) return undefined

    const params =
      currentData.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: currentData.maxPriorityFeePerGas[speed],
            maxFeePerGas: currentData.maxFeePerGas[speed],
          }
        : {
            gasPrice: currentData.gasPrice[speed],
          }

    return {
      type: currentData.type,
      speed,
      gasFee: currentData.gasFee[speed],
      params,
    }
  }, [currentData, speed])
}

// TODO: deprecate this
export function useGasFeeInfo(
  chainId: ChainId | undefined,
  tx: providers.TransactionRequest | null,
  fallbackGasEstimate?: string,
  intervalOverride?: number
) {
  const [gasFeeInfo, setGasFeeInfo] = useState<FeeInfo | undefined>(undefined)
  const provider = useProvider(chainId || ChainId.Mainnet)

  const computeGas = useCallback(async () => {
    try {
      if (!provider || !chainId) {
        throw new Error('Missing params. Query should not be enabled.')
      }

      if (!tx) return

      computeGasFee(chainId, tx, provider, fallbackGasEstimate)
        .then((feeInfo) => {
          setGasFeeInfo(feeInfo)
        })
        .catch((error) => {
          throw error
        })
    } catch (error) {
      logger.error('useGasFee', '', 'Error computing gas fee', error)
    }
  }, [chainId, provider, tx, fallbackGasEstimate])

  useInterval(computeGas, intervalOverride ?? GAS_FEE_REFRESH_INTERVAL, true)

  return gasFeeInfo
}

export function useUSDGasPrice(chainId: ChainId | undefined, gasFee?: string) {
  const currencyAmount =
    gasFee && chainId
      ? CurrencyAmount.fromRawAmount(NativeCurrency.onChain(chainId), gasFee)
      : undefined

  return useUSDCValue(currencyAmount)?.toExact()
}

// We want network fee to update instantly in cancelation UI, and dont want to wait full 10s for
// network conditions to reset based on GAS_FEE_REFRESH_INTERVAL.
const CANCEL_GAS_FEE_INTERVAL_OVERRIDE = 1000

/**
 * Construct cancelation transaction with increased gas (based on current network conditions),
 * then use it to compute new gas info.
 */
export function useCancelationGasFeeInfo(transaction: TransactionDetails): {
  isLoading: boolean
  feeInfo: FeeInfo | undefined
} {
  const [txnRequest, setTxnRequest] = useState<providers.TransactionRequest | undefined>()
  const provider = useProvider(transaction.chainId)
  const [isLoading, setIsLoading] = useState(true)

  const createTxnRequest = useCallback(async () => {
    if (!provider) return
    try {
      const { options } = transaction
      const oldRequest = options.request
      const currentFeeData = await provider.getFeeData()
      const feeParams = getAdjustedGasFeeParams(
        oldRequest,
        currentFeeData,
        TRANSACTION_CANCELLATION_GAS_FACTOR
      )
      const newTxRequest: providers.TransactionRequest = {
        to: transaction.from,
        value: '0x0',
        gasLimit: TRANSACTION_MINIMUM_GAS,
        ...feeParams,
      }
      setTxnRequest(newTxRequest)
    } catch (error) {
      logger.error('useCancelationGasFeeInfo', '', 'Error computing cancelation fee', error)
    } finally {
      setIsLoading(false)
    }
  }, [provider, transaction])

  useEffect(() => {
    if (!txnRequest && isLoading) {
      createTxnRequest()
    }
  }, [createTxnRequest, isLoading, txnRequest])

  const feeInfo = useGasFeeInfo(
    transaction.chainId,
    txnRequest ?? null,
    undefined,
    CANCEL_GAS_FEE_INTERVAL_OVERRIDE
  )

  return { isLoading, feeInfo }
}

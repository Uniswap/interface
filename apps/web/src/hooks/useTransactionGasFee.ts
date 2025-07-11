import { TransactionRequest } from '@ethersproject/abstract-provider'
import { useCallback, useMemo } from 'react'
import { client } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiReplica/client'
import { useAsyncData } from 'utilities/src/react/hooks'
import { formatGwei, parseGwei } from 'viem'

enum FeeType {
  Legacy = 'legacy',
  Eip1559 = 'eip1559',
}

interface GasFeeResponseBase {
  type: FeeType
  gasLimit: string
  gasFee: {
    normal: string
    fast: string
    urgent: string
  }
}

interface GasFeeResponseEip1559 extends GasFeeResponseBase {
  type: FeeType.Eip1559
  maxFeePerGas: {
    normal: string
    fast: string
    urgent: string
  }
  maxPriorityFeePerGas: {
    normal: string
    fast: string
    urgent: string
  }
}

interface GasFeeResponseLegacy extends GasFeeResponseBase {
  type: FeeType.Legacy
  gasPrice: {
    normal: string
    fast: string
    urgent: string
  }
}

type TransactionLegacyFeeParams = {
  gasPrice: string
  gasLimit: string
}

type TransactionEip1559FeeParams = {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
}

export interface GasFeeResult {
  value?: string
  isLoading: boolean
  params?: TransactionLegacyFeeParams | TransactionEip1559FeeParams
}

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

export function useTransactionGasFee(
  tx?: TransactionRequest,
  speed: GasSpeed = GasSpeed.Urgent,
  skip: boolean = !tx,
): GasFeeResult {
  const gasFeeFetcher = useGasFeeQuery(tx, skip)
  const { data, isLoading } = useAsyncData(gasFeeFetcher)

  return useMemo(() => {
    if (!data) {
      return { isLoading }
    }

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
      value: data.gasFee[speed],
      isLoading,
      params,
    }
  }, [data, isLoading, speed])
}

function useGasFeeQuery(tx?: TransactionRequest, skip: boolean = !tx) {
  const gasFeeFetcher = useCallback(async (): Promise<GasFeeResponseEip1559 | GasFeeResponseLegacy | undefined> => {
    if (skip || !client || !tx) {
      return undefined
    }

    try {
      // Get gas limit estimation
      const gasLimit = await client.estimateGas({
        to: tx.to as `0x${string}`,
        account: tx.from as `0x${string}`,
        value: tx.value,
        data: tx.data as `0x${string}`,
      })

      // Check if EIP-1559 is supported
      const block = await client.getBlock()
      const isEip1559Supported = block.baseFeePerGas !== null

      if (isEip1559Supported) {
        // Get EIP-1559 fee data
        const feeData = await client.estimateFeesPerGas()
        const baseFeePerGas = block.baseFeePerGas!

        // Calculate different priority fee levels
        const normalPriorityFee = feeData.maxPriorityFeePerGas || parseGwei('1.5')
        const fastPriorityFee = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : parseGwei('3')
        const urgentPriorityFee = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 3n : parseGwei('5')

        // Calculate max fee per gas (baseFee + priorityFee + buffer)
        const normalMaxFee = baseFeePerGas * 2n + normalPriorityFee
        const fastMaxFee = baseFeePerGas * 2n + fastPriorityFee
        const urgentMaxFee = baseFeePerGas * 2n + urgentPriorityFee

        // Calculate total gas fees
        const normalGasFee = formatGwei(normalMaxFee * gasLimit)
        const fastGasFee = formatGwei(fastMaxFee * gasLimit)
        const urgentGasFee = formatGwei(urgentMaxFee * gasLimit)

        return {
          type: FeeType.Eip1559,
          gasLimit: gasLimit.toString(),
          gasFee: {
            normal: normalGasFee,
            fast: fastGasFee,
            urgent: urgentGasFee,
          },
          maxFeePerGas: {
            normal: normalMaxFee.toString(),
            fast: fastMaxFee.toString(),
            urgent: urgentMaxFee.toString(),
          },
          maxPriorityFeePerGas: {
            normal: normalPriorityFee.toString(),
            fast: fastPriorityFee.toString(),
            urgent: urgentPriorityFee.toString(),
          },
        }
      } else {
        // Legacy gas pricing
        const gasPrice = await client.getGasPrice()

        // Calculate different gas price levels
        const normalGasPrice = gasPrice
        const fastGasPrice = (gasPrice * 120n) / 100n // 20% higher
        const urgentGasPrice = (gasPrice * 150n) / 100n // 50% higher

        // Calculate total gas fees
        const normalGasFee = formatGwei(normalGasPrice * gasLimit)
        const fastGasFee = formatGwei(fastGasPrice * gasLimit)
        const urgentGasFee = formatGwei(urgentGasPrice * gasLimit)

        return {
          type: FeeType.Legacy,
          gasLimit: gasLimit.toString(),
          gasFee: {
            normal: normalGasFee,
            fast: fastGasFee,
            urgent: urgentGasFee,
          },
          gasPrice: {
            normal: normalGasPrice.toString(),
            fast: fastGasPrice.toString(),
            urgent: urgentGasPrice.toString(),
          },
        }
      }
    } catch (error) {
      return undefined
    }
  }, [skip, tx, client])

  return gasFeeFetcher
}

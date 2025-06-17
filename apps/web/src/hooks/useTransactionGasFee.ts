import { TransactionRequest } from '@ethersproject/abstract-provider'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'

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

// GasFeeResponse is the type that comes directly from the Gas Service API
type GasFeeResponseError = { errorCode: string; detail?: string; id?: string }
type GasFeeResponse = GasFeeResponseEip1559 | GasFeeResponseLegacy | GasFeeResponseError

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

export function useTransactionGasFee(tx?: TransactionRequest, speed: GasSpeed = GasSpeed.Urgent): GasFeeResult {
  const { data, isLoading } = useGasFeeQuery(tx)

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

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_BASE_API_URL

const isErrorResponse = (res: Response, gasFee: GasFeeResponse): gasFee is GasFeeResponseError =>
  res.status < 200 || res.status > 202

function useGasFeeQuery(tx?: TransactionRequest): UseQueryResult<GasFeeResponseEip1559 | GasFeeResponseLegacy | null> {
  const skip = !tx

  const gasFeeFetcher = useCallback(async () => {
    const res = await fetch(`${UNISWAP_API_URL}/v1/gas-fee`, {
      method: 'POST',
      body: JSON.stringify(tx),
    })

    const body = (await res.json()) as GasFeeResponse

    if (isErrorResponse(res, body)) {
      return null
    }

    return body
  }, [tx])

  return useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.WebTransactionGasFee, tx],
      queryFn: gasFeeFetcher,
      enabled: !skip,
    }),
  )
}

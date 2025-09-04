import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useTradeService } from 'uniswap/src/features/services'
import { createIndicativeTradeServiceQueryOptions } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useIndicativeTradeServiceQueryOptions'
import { IndicativeTrade, type UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { useEvent } from 'utilities/src/react/hooks'

export function useIndicativeTradeQuery(params: UseTradeArgs): {
  trade: IndicativeTrade | undefined
  isLoading: boolean
} {
  const tradeService = useTradeService()
  const getIndicativeTradeQueryOptions = useEvent(createIndicativeTradeServiceQueryOptions({ tradeService }))

  const { data, isLoading }: UseQueryResult<IndicativeTrade | null> = useQuery(getIndicativeTradeQueryOptions(params))

  return {
    trade: data ?? undefined,
    isLoading,
  }
}

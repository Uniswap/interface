import { queryOptions, useQuery } from '@tanstack/react-query'
import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { fetchOrder } from 'uniswap/src/data/apiClients/jupiterApi/order/request'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SolanaTrade, createSolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type SolanaTradeService = {
  getTrade: (args: UseTradeArgs) => Promise<SolanaTrade | null>
}

export function createSolanaTradeService(): SolanaTradeService {
  return {
    async getTrade(args: UseTradeArgs): Promise<SolanaTrade | null> {
      const input = args.tradeType === TradeType.EXACT_INPUT ? args.amountSpecified?.currency : args.otherCurrency
      const output = args.tradeType === TradeType.EXACT_OUTPUT ? args.amountSpecified?.currency : args.otherCurrency

      if (!input || !output) {
        return null
      }

      const slippageBps = args.customSlippageTolerance ? (args.customSlippageTolerance * 100).toString() : undefined
      const swapMode = args.tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut'

      const quote = await fetchOrder({
        inputMint: input.wrapped.address,
        outputMint: output.wrapped.address,
        amount: args.amountSpecified?.quotient.toString() ?? '0',
        taker: args.account?.address,
        slippageBps,
        swapMode,
      })

      return createSolanaTrade({ quote, inputToken: input, outputToken: output })
    },
  }
}

type SolanaTradeQueryOptions = QueryOptionsResult<
  SolanaTrade | null,
  Error,
  SolanaTrade | null,
  (UseTradeArgs | ReactQueryCacheKey.SolanaTradeService)[]
>

function createGetSolanaQueryOptions(ctx: { solanaTradeService: SolanaTradeService }) {
  return function getSolanaQueryOptions(args: UseTradeArgs): SolanaTradeQueryOptions {
    return queryOptions({
      queryKey: [ReactQueryCacheKey.SolanaTradeService, args],
      queryFn: () => ctx.solanaTradeService.getTrade(args),
      refetchInterval: 2000,
      enabled: !args.skip && args.amountSpecified?.currency.chainId === UniverseChainId.Solana,
    })
  }
}

export function useSolanaTrade(args: UseTradeArgs): TradeWithStatus<SolanaTrade> {
  const solanaTradeService = useMemo(() => createSolanaTradeService(), [])
  const { svmAccount } = useWallet()

  const getSolanaQueryOptions = useEvent(createGetSolanaQueryOptions({ solanaTradeService }))

  const argsWithSolanaAccount = useMemo(() => ({ ...args, account: svmAccount }), [args, svmAccount])

  const { data, isLoading, isFetching, error } = useQuery(getSolanaQueryOptions(argsWithSolanaAccount))

  return useMemo(
    () => ({
      isLoading: args.isDebouncing || isLoading,
      isFetching,
      trade: data ?? null,
      indicativeTrade: undefined,
      isIndicativeLoading: false,
      error,
      gasEstimate: undefined,
    }),
    [args.isDebouncing, data, error, isFetching, isLoading],
  )
}

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { filterChainIdsByPlatform } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { getSolanaConnection } from 'uniswap/src/features/providers/getSolanaConnection'
import { SOLANA_ONCHAIN_BALANCE_COMMITMENT } from 'uniswap/src/data/solanaConnection/getSolanaParsedTokenAccountsByOwnerQueryOptions'
import { PublicKey } from '@solana/web3.js'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { logger } from 'utilities/src/logger/logger'
import type { Address } from 'utilities/src/addresses/types'

interface OnChainPortfolioTotalValueResult {
  balanceUSD: number
  loading: boolean
  error: Error | undefined
}

/**
 * 使用链上查询获取投资组合总价值（USD）
 * 替代 Uniswap GetPortfolio API，避免 CORS 问题和外部依赖
 * 
 * 当前实现：查询所有启用链的原生代币余额
 * 如果所有链的原生代币余额都为 0，则认为投资组合为 0
 */
export function useOnChainPortfolioTotalValue({
  evmAddress,
  svmAddress,
}: {
  evmAddress?: Address
  svmAddress?: Address
}): OnChainPortfolioTotalValueResult {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains()
  
  // 过滤出 EVM 和 SVM 链
  const evmChainIds = useMemo(
    () => filterChainIdsByPlatform(enabledChainIds, Platform.EVM),
    [enabledChainIds]
  )
  const svmChainIds = useMemo(
    () => filterChainIdsByPlatform(enabledChainIds, Platform.SVM),
    [enabledChainIds]
  )

  // 查询所有链的原生代币余额
  const { data, isLoading, error } = useQuery({
    queryKey: [
      ReactQueryCacheKey.OnchainPortfolioTotalValue,
      evmAddress,
      svmAddress,
      evmChainIds,
      svmChainIds,
      isTestnetModeEnabled,
    ],
    queryFn: async (): Promise<{ balanceUSD: number; hasAnyBalance: boolean }> => {
      if (!evmAddress && !svmAddress) {
        return { balanceUSD: 0, hasAnyBalance: false }
      }

      // 并行查询所有 EVM 链的原生代币余额
      const evmBalancePromises = evmChainIds.map(async (chainId): Promise<bigint> => {
        if (!evmAddress) return BigInt(0)
        
        try {
          const provider = createEthersProvider({ chainId })
          if (!provider) {
            return BigInt(0)
          }
          const balance = await provider.getBalance(evmAddress)
          return BigInt(balance.toString())
        } catch (error) {
          logger.warn('useOnChainPortfolioTotalValue', 'queryFn', `Failed to fetch balance for chain ${chainId}`, {
            error,
            chainId,
            address: evmAddress,
          })
          return BigInt(0)
        }
      })

      // 并行查询所有 SVM 链的原生代币余额
      const svmBalancePromises = svmChainIds.map(async (chainId): Promise<bigint> => {
        if (!svmAddress) return BigInt(0)
        
        try {
          const connection = getSolanaConnection()
          if (!connection) {
            return BigInt(0)
          }
          const balance = await connection.getBalance(new PublicKey(svmAddress), SOLANA_ONCHAIN_BALANCE_COMMITMENT)
          return BigInt(balance.toString())
        } catch (error) {
          logger.warn('useOnChainPortfolioTotalValue', 'queryFn', `Failed to fetch balance for chain ${chainId}`, {
            error,
            chainId,
            address: svmAddress,
          })
          return BigInt(0)
        }
      })

      // 等待所有查询完成
      const [evmBalances, svmBalances] = await Promise.all([
        Promise.all(evmBalancePromises),
        Promise.all(svmBalancePromises),
      ])

      // 检查是否有任何非零余额
      const allBalances = [...evmBalances, ...svmBalances]
      const hasAnyBalance = allBalances.some((balance) => balance > BigInt(0))

      // 如果测试网模式启用，或者有任何余额，返回非零值
      // 否则返回 0（表示投资组合为空）
      const balanceUSD = isTestnetModeEnabled || hasAnyBalance ? 1 : 0

      return { balanceUSD, hasAnyBalance }
    },
    enabled: !!(evmAddress || svmAddress) && (evmChainIds.length > 0 || svmChainIds.length > 0),
    staleTime: 30 * 1000, // 30 秒
    refetchInterval: 60 * 1000, // 60 秒刷新一次
  })

  return useMemo(
    () => ({
      balanceUSD: data?.balanceUSD ?? 0,
      loading: isLoading,
      error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
    }),
    [data?.balanceUSD, isLoading, error]
  )
}

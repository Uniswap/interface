import { ParsedAccountData, PublicKey } from '@solana/web3.js'
import { queryOptions } from '@tanstack/react-query'
import { getSolanaConnection } from 'uniswap/src/features/providers/getSolanaConnection'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

const SOLANA_ONCHAIN_BALANCE_CACHE_TIME = 100
const SOLANA_TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

type SolanaParsedTokenAccountsByOwnerQueryParams = {
  accountAddress: string
}

type SolanaParsedTokenAccount = {
  mint?: string
  tokenAmount?: string
}

type SolanaParsedTokenAccountsByOwnerQueryOptions = QueryOptionsResult<
  Record<string, SolanaParsedTokenAccount>,
  Error,
  Record<string, SolanaParsedTokenAccount>,
  [ReactQueryCacheKey.SolanaConnection, 'getParsedTokenAccountsByOwner', SolanaParsedTokenAccountsByOwnerQueryParams]
>

function parseTokenAccount(account: ParsedAccountData): SolanaParsedTokenAccount {
  try {
    const mint = account.parsed.info.mint?.toString()
    const tokenAmount = account.parsed.info.tokenAmount?.amount?.toString()
    return { mint, tokenAmount }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'solanaConnectionQueryOptions.ts', function: 'parseTokenAccount' },
      extra: { account },
    })
    return { mint: undefined, tokenAmount: undefined }
  }
}

export function getSolanaParsedTokenAccountsByOwnerQueryOptions({
  params,
}: {
  params: SolanaParsedTokenAccountsByOwnerQueryParams
}): SolanaParsedTokenAccountsByOwnerQueryOptions {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.SolanaConnection, 'getParsedTokenAccountsByOwner', params],
    queryFn: async () => {
      const connection = getSolanaConnection()

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(params.accountAddress), {
        programId: SOLANA_TOKEN_PROGRAM_ID,
      })

      const balanceMap: Record<string, SolanaParsedTokenAccount> = {}

      tokenAccounts.value.forEach((account) => {
        const parsedTokenAccount = parseTokenAccount(account.account.data)
        if (parsedTokenAccount.mint) {
          balanceMap[parsedTokenAccount.mint] = parsedTokenAccount
        }
      })

      return balanceMap
    },
    staleTime: SOLANA_ONCHAIN_BALANCE_CACHE_TIME,
    gcTime: SOLANA_ONCHAIN_BALANCE_CACHE_TIME,
  })
}

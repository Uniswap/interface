import { Commitment, ParsedAccountData, PublicKey } from '@solana/web3.js'
import { queryOptions } from '@tanstack/react-query'
import { getSolanaConnection } from 'uniswap/src/features/providers/getSolanaConnection'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * When fetching onchain balances on Solana, we use the 'confirmed' commitment level instead of the default 'processed' level.
 * This allows us to get an updated balance much faster after a swap.
 *
 * | Level     | Time    | Safety                                 |
 * |-----------|---------|----------------------------------------|
 * | Processed | ~400ms  | ~5% rollback risk                      |
 * | Confirmed | ~1-2s   | No rollback in Solana's 5-year history |
 * | Finalized | ~12-13s | Completely irreversible                |
 */
export const SOLANA_ONCHAIN_BALANCE_COMMITMENT: Commitment = 'confirmed'

// We want this to return fresh data.
// We only return cached data if it's called multiple times almost at the exact same time.
const SOLANA_ONCHAIN_BALANCE_CACHE_TIME_MS = 100

// Solana has two primary token programs; we need to fetch for both
// ref: https://solana.com/docs/tokens#token-program
const SOLANA_TOKEN_PROGRAM_IDS = [
  new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
]

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

      const tokenAccountBalances = (
        await Promise.all(
          SOLANA_TOKEN_PROGRAM_IDS.map((programId) =>
            connection.getParsedTokenAccountsByOwner(
              new PublicKey(params.accountAddress),
              { programId },
              SOLANA_ONCHAIN_BALANCE_COMMITMENT,
            ),
          ),
        )
      ).flatMap((result) => result.value)

      const balanceMap: Record<string, SolanaParsedTokenAccount> = {}

      tokenAccountBalances.forEach((account) => {
        const parsedTokenAccount = parseTokenAccount(account.account.data)
        if (parsedTokenAccount.mint) {
          balanceMap[parsedTokenAccount.mint] = parsedTokenAccount
        }
      })

      return balanceMap
    },
    staleTime: SOLANA_ONCHAIN_BALANCE_CACHE_TIME_MS,
    gcTime: SOLANA_ONCHAIN_BALANCE_CACHE_TIME_MS,
  })
}

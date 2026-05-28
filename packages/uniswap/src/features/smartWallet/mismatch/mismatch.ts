import type { DelegationService } from 'uniswap/src/features/smartWallet/delegation/delegation'
import type { Logger } from 'utilities/src/logger/logger'

interface MismatchCtx {
  delegationService: DelegationService
  getIsAtomicBatchingSupported: (input: { chainId: number }) => Promise<boolean>
  onMismatchDetected?: (payload: { chainId: number; isDelegated: boolean; delegatedAddress: Address }) => void
  logger?: Logger
}

export type HasMismatchUtil = (input: { address: Address; chainId: number }) => Promise<boolean>

export function createHasMismatchUtil(ctx: MismatchCtx): HasMismatchUtil {
  const withPerformanceLogger = createWithPerformanceLogger({
    logger: ctx.logger,
    name: 'hasMismatch',
    filename: 'mismatch.ts',
  })
  /**
   * Returns true if the connected wallet thinks the account is not a smart account (EIP-7702),
   * but there is a deployed contract at the address.
   */
  return withPerformanceLogger(async function hasMismatch(input: {
    address: Address
    chainId: number
  }): Promise<boolean> {
    const [delegatedResult, isAtomicBatchingSupported] = await Promise.all([
      ctx.delegationService.getIsAddressDelegated(input),
      ctx.getIsAtomicBatchingSupported({
        chainId: input.chainId,
      }),
    ])
    const isMismatch = !isAtomicBatchingSupported && delegatedResult.isDelegated
    if (isMismatch && delegatedResult.delegatedAddress) {
      ctx.onMismatchDetected?.({
        chainId: input.chainId,
        isDelegated: delegatedResult.isDelegated,
        delegatedAddress: delegatedResult.delegatedAddress,
      })
    }
    return isMismatch
  })
}

/**
 * Creates a performance logger wrapper for async functions.
 *
 * @param ctx - The context object containing logger and metadata
 * @param ctx.logger - The logger instance to use
 * @param ctx.name - The name of the operation being logged
 * @param ctx.filename - The filename where the operation is being performed
 * @returns A function that takes a function to be measured and returns a wrapped version that logs performance
 *
 * @example
 * const withLogger = createWithPerformanceLogger({
 *   logger,
 *   name: 'fetchData',
 *   filename: 'dataService.ts'
 * });
 *
 * const loggedFetchData = withLogger(fetchData);
 * const data = await loggedFetchData(id, options);
 */
function createWithPerformanceLogger(ctx?: {
  logger?: Logger
  name: string
  filename: string
}): <Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) => (...args: Args) => Promise<T> {
  return <Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) => {
    return async (...args: Args): Promise<T> => {
      if (!ctx?.logger || !ctx.filename || !ctx.name) {
        return fn(...args)
      }

      const start = performance.now()
      try {
        const result = await fn(...args)
        const end = performance.now()
        ctx.logger.info(ctx.filename, ctx.name, `${ctx.name} took ${end - start}ms`)
        return result
      } catch (error) {
        const end = performance.now()
        ctx.logger.error(error, {
          tags: {
            file: ctx.filename,
            function: ctx.name,
          },
          extra: {
            duration: end - start,
          },
        })
        throw error
      }
    }
  }
}

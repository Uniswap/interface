// biome-ignore lint/style/noRestrictedImports: Anvil transactions need direct ethers imports
import { expect } from '@playwright/test'
import type { AnvilClient } from 'playwright/fixtures/anvil'
import { Address } from 'viem'

/**
 * Wait for transactions to be confirmed by mining blocks
 * @param anvil - The anvil client instance
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine (default: 1)
 */
async function _waitForTransaction(input: { anvil: AnvilClient; options?: { blocks?: number } }): Promise<void> {
  const { anvil, options } = input
  await anvil.mine({ blocks: options?.blocks ?? 1 })
}

/**
 * Check transaction count with automatic mining to ensure transactions are confirmed
 * @param anvil - The anvil client instance
 * @param address - The address to check transaction count for
 * @param expectedCount - The expected transaction count
 * @param options - Configuration options
 * @param options.mine - Whether to mine a block before checking (default: true)
 * @param options.blocks - Number of blocks to mine if mining is enabled (default: 1)
 */
async function _expectTransactionCount(input: {
  anvil: AnvilClient
  address: Address
  expectedCount: number
  options?: { mine?: boolean; blocks?: number }
}): Promise<void> {
  const { anvil, address, expectedCount, options } = input
  const shouldMine = options?.mine !== false
  const blocks = options?.blocks ?? 1

  if (shouldMine) {
    await anvil.mine({ blocks })
  }

  const txCount = await anvil.getTransactionCount({ address })
  expect(txCount).toBe(expectedCount)
}

/**
 * Higher-order function to wrap an action with transaction count tracking
 * Gets initial count, performs action, mines block, and returns transaction info
 * @param anvil - The anvil client instance
 * @param address - The address to track transactions for
 * @param action - The action to perform (should trigger a transaction)
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine after action (default: 1)
 */
async function withTransactionConfirmation(input: {
  anvil: AnvilClient
  address: Address
  action: () => Promise<void>
  options?: { blocks?: number }
}): Promise<{
  initialCount: number
  finalCount: number
  transactionsAdded: number
}> {
  const { anvil, address, action, options } = input
  const initialCount = await anvil.getTransactionCount({ address })
  await action()
  await anvil.mine({ blocks: options?.blocks ?? 1 })
  const finalCount = await anvil.getTransactionCount({ address })

  return {
    initialCount,
    finalCount,
    transactionsAdded: finalCount - initialCount,
  }
}

/**
 * Convenience function for the common pattern of checking a single transaction was added
 * @param anvil - The anvil client instance
 * @param address - The address to track transactions for
 * @param action - The action to perform (should trigger exactly one transaction)
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine after action (default: 1)
 */
async function expectSingleTransaction(input: {
  anvil: AnvilClient
  address: Address
  action: () => Promise<void>
  options?: { blocks?: number }
}): Promise<void> {
  const { anvil, address, action, options } = input
  const result = await withTransactionConfirmation({ anvil, address, action, options })
  expect(result.transactionsAdded).toBe(1)
}

/**
 * Convenience function for checking multiple transactions were added
 * @param anvil - The anvil client instance
 * @param address - The address to track transactions for
 * @param action - The action to perform (should trigger multiple transactions)
 * @param expectedCount - Expected number of transactions to be added
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine after action (default: 1)
 */
async function expectMultipleTransactions(input: {
  anvil: AnvilClient
  address: Address
  action: () => Promise<void>
  expectedCount: number
  options?: { blocks?: number }
}): Promise<void> {
  const result = await withTransactionConfirmation(input)
  expect(result.transactionsAdded).toBe(input.expectedCount)
}

/**
 * Factory function that creates an expectSingleTransaction function with pre-configured context
 * @param anvil - The anvil client instance
 * @param address - The address to track transactions for
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine after action (default: 1)
 * @returns A function that takes an action and expects exactly one transaction
 */
export function createExpectSingleTransaction(context: {
  anvil: AnvilClient
  address: Address
  options?: { blocks?: number }
}): (action: () => Promise<void>) => Promise<void> {
  return async (action: () => Promise<void>) => {
    await expectSingleTransaction({
      ...context,
      action,
    })
  }
}

/**
 * Factory function that creates an expectMultipleTransactions function with pre-configured context
 * @param anvil - The anvil client instance
 * @param address - The address to track transactions for
 * @param expectedCount - Expected number of transactions to be added
 * @param options - Configuration options
 * @param options.blocks - Number of blocks to mine after action (default: 1)
 * @returns A function that takes an action and expects the specified number of transactions
 */
export function createExpectMultipleTransactions(context: {
  anvil: AnvilClient
  address: Address
  expectedCount: number
  options?: { blocks?: number }
}): (action: () => Promise<void>) => Promise<void> {
  return async (action: () => Promise<void>) => {
    await expectMultipleTransactions({
      ...context,
      action,
    })
  }
}

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import type {
  OnChainTransactionDetails,
  TransactionOptions,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { logger as loggerUtil } from 'utilities/src/logger/logger'
import type { Mock } from 'vitest'
import type { AnalyticsService } from 'wallet/src/features/transactions/executeTransaction/services/analyticsService'
import type { TransactionRepository } from 'wallet/src/features/transactions/executeTransaction/services/TransactionRepository/transactionRepository'
import {
  emitSubmissionErrorTelemetry,
  handleTransactionError,
} from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionLifecycleHelpers'
import { rpcUtilsFixtures } from 'wallet/src/test/rpcUtilsFixtures'

describe('handleTransactionError', () => {
  const mockRepo = {
    finalizeTransaction: vi.fn(),
    getPendingPrivateTransactionCount: vi.fn(),
  } as unknown as TransactionRepository

  const mockAnalytics = {
    trackTransactionEvent: vi.fn(),
    trackSwapSubmitted: vi.fn(),
  } as unknown as AnalyticsService

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as typeof loggerUtil

  const baseTx = {
    id: 'tx1',
    from: '0xabc',
    hash: undefined,
    chainId: UniverseChainId.Mainnet,
    options: { request: { nonce: 7 }, submitViaPrivateRpc: true, includesDelegation: true },
  } as unknown as OnChainTransactionDetails

  beforeEach(() => {
    vi.clearAllMocks()
    ;(mockRepo.finalizeTransaction as Mock).mockResolvedValue(undefined)
    ;(mockRepo.getPendingPrivateTransactionCount as Mock).mockResolvedValue(3)
  })

  it('finalizes as Failed and emits a refined-category analytics event for a gapped-nonce error', async () => {
    await expect(
      handleTransactionError({
        error: new Error(rpcUtilsFixtures.nonceError), // real "gapped-nonce tx from delegated accounts"
        unsubmittedTransaction: baseTx,
        chainId: UniverseChainId.Mainnet,
        typeInfo: { type: TransactionType.Swap } as TransactionTypeInfo,
        options: baseTx.options as TransactionOptions,
        methodName: 'submitTransaction',
        transactionRepository: mockRepo,
        analyticsService: mockAnalytics,
        logger: mockLogger,
      }),
    ).rejects.toThrow('Failed to send transaction: gapped_nonce')

    expect(mockRepo.finalizeTransaction).toHaveBeenCalled()
    expect(mockAnalytics.trackTransactionEvent as Mock).toHaveBeenCalledWith(
      WalletEventName.OnchainTransactionSubmissionError,
      expect.objectContaining({
        transaction_id: 'tx1',
        error_category: 'gapped_nonce',
        nonce: 7,
        pending_private_tx_count_at_failure: 3,
        submit_via_private_rpc: true,
        includes_delegation: true,
      }),
    )
  })

  it('rethrows a non-Error without emitting analytics', async () => {
    await expect(
      handleTransactionError({
        error: 'string error',
        unsubmittedTransaction: baseTx,
        chainId: UniverseChainId.Mainnet,
        typeInfo: { type: TransactionType.Swap } as TransactionTypeInfo,
        options: baseTx.options as TransactionOptions,
        methodName: 'submitTransaction',
        transactionRepository: mockRepo,
        analyticsService: mockAnalytics,
        logger: mockLogger,
      }),
    ).rejects.toBe('string error')

    expect(mockRepo.finalizeTransaction).toHaveBeenCalled()
    expect(mockAnalytics.trackTransactionEvent as Mock).not.toHaveBeenCalled()
  })
})

describe('emitSubmissionErrorTelemetry', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as typeof loggerUtil

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the refined category and emits the full event payload for an Error', () => {
    const emitEvent = vi.fn()
    const category = emitSubmissionErrorTelemetry({
      error: new Error(rpcUtilsFixtures.nonceError), // "gapped-nonce tx from delegated accounts"
      chainId: UniverseChainId.Mainnet,
      transactionType: 'plan_swap',
      methodName: 'handleSwapTransactionStep',
      logger: mockLogger,
      emitEvent,
      options: {
        submitViaPrivateRpc: true,
        privateRpcProvider: 'flashbots',
        includesDelegation: true,
      } as TransactionOptions,
      assignedNonce: 9,
      pendingPrivateTxCountAtFailure: 4,
    })

    expect(category).toBe('gapped_nonce')
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        chain_id: UniverseChainId.Mainnet,
        nonce: 9,
        error_category: 'gapped_nonce',
        pending_private_tx_count_at_failure: 4,
        submit_via_private_rpc: true,
        private_rpc_provider: 'flashbots',
        includes_delegation: true,
        transaction_type: 'plan_swap',
      }),
    )
    expect(mockLogger.warn).toHaveBeenCalled()
  })

  it('returns undefined and emits nothing for a non-Error', () => {
    const emitEvent = vi.fn()
    const category = emitSubmissionErrorTelemetry({
      error: 'boom',
      chainId: UniverseChainId.Mainnet,
      transactionType: 'swap',
      methodName: 'submitTransaction',
      logger: mockLogger,
      emitEvent,
    })

    expect(category).toBeUndefined()
    expect(emitEvent).not.toHaveBeenCalled()
  })
})

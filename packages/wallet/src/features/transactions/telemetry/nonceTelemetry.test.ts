import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { OnChainTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  buildBacklogProperties,
  buildNonceCalculatedProperties,
  buildPendingTransactionStuckProperties,
  summarizePrivatePendingTxs,
} from 'wallet/src/features/transactions/telemetry/nonceTelemetry'

describe('summarizePrivatePendingTxs', () => {
  it('returns zeroed/empty summary for an empty list', () => {
    expect(summarizePrivatePendingTxs({ txs: [], nowMs: 1000 })).toEqual({
      inflating_tx_count: 0,
      oldest_inflating_tx_age_ms: 0,
      inflating_tx_ids: [],
      inflating_tx_hashes: [],
    })
  })

  it('computes count, oldest age, ids, and hashes (filtering missing hashes)', () => {
    const result = summarizePrivatePendingTxs({
      txs: [
        { id: 'a', hash: '0x1', nonce: 5, addedTime: 400, status: 'pending' },
        { id: 'b', hash: undefined, nonce: 6, addedTime: 100, status: 'pending' },
      ],
      nowMs: 1000,
    })
    expect(result.inflating_tx_count).toBe(2)
    expect(result.oldest_inflating_tx_age_ms).toBe(900) // 1000 - 100 (oldest addedTime)
    expect(result.inflating_tx_ids).toEqual(['a', 'b'])
    expect(result.inflating_tx_hashes).toEqual(['0x1']) // undefined hash dropped
  })

  it('caps ids/hashes at 10 while count + oldest age reflect ALL txs', () => {
    const txs = Array.from({ length: 13 }, (_, i) => ({
      id: `id${i}`,
      hash: `0x${i}`,
      nonce: i,
      addedTime: 1000 - i, // i=12 is the oldest (988), and is NOT in the first-10 cap
      status: 'pending',
    }))
    const result = summarizePrivatePendingTxs({ txs, nowMs: 2000 })
    expect(result.inflating_tx_count).toBe(13) // full count, not capped
    expect(result.inflating_tx_ids).toHaveLength(10)
    expect(result.inflating_tx_hashes).toHaveLength(10)
    expect(result.inflating_tx_ids[0]).toBe('id0')
    expect(result.oldest_inflating_tx_age_ms).toBe(1012) // 2000 - min(addedTime)=988, over ALL 13
  })
})

describe('buildNonceCalculatedProperties', () => {
  it('omits inflating fields when count is 0', () => {
    expect(
      buildNonceCalculatedProperties({
        chainId: UniverseChainId.Mainnet,
        address: '0xabc',
        submitViaPrivateRpc: false,
        onChainPendingNonce: 10,
        pendingPrivateTxCount: 0,
        privateRpcSupported: true,
        inflatingTxs: [],
        nowMs: 1000,
      }),
    ).toEqual({
      chain_id: UniverseChainId.Mainnet,
      address: '0xabc',
      submit_via_private_rpc: false,
      on_chain_pending_nonce: 10,
      pending_private_tx_count: 0,
      final_nonce: 10,
      private_rpc_supported: true,
    })
  })

  it('adds the count to the nonce and includes inflating ids/hashes when count > 0', () => {
    const props = buildNonceCalculatedProperties({
      chainId: UniverseChainId.Mainnet,
      address: '0xabc',
      submitViaPrivateRpc: false,
      onChainPendingNonce: 10,
      pendingPrivateTxCount: 2,
      privateRpcSupported: true,
      inflatingTxs: [
        { id: 'b', hash: '0x2', nonce: 6, addedTime: 100, status: 'pending' },
        { id: 'c', hash: '0x3', nonce: 7, addedTime: 200, status: 'pending' },
      ],
      nowMs: 1000,
    })
    expect(props.final_nonce).toBe(12)
    expect(props.inflating_tx_count).toBe(2)
    expect(props.inflating_tx_ids).toEqual(['b', 'c'])
    expect(props.inflating_tx_hashes).toEqual(['0x2', '0x3'])
    expect(props.oldest_inflating_tx_age_ms).toBe(900)
  })
})

describe('buildPendingTransactionStuckProperties', () => {
  it('derives age_ms, ids, and flags from the transaction', () => {
    const transaction = {
      id: 'tx1',
      hash: '0xhash',
      chainId: UniverseChainId.Mainnet,
      addedTime: 100,
      options: { submitViaPrivateRpc: true, privateRpcProvider: 'flashbots' },
    } as unknown as OnChainTransactionDetails

    expect(
      buildPendingTransactionStuckProperties({
        transaction,
        requestNonce: 7,
        nextNonce: 7,
        providerKnowsTx: false,
        reason: 'invalidation_check_false',
        nowMs: 1100,
      }),
    ).toEqual({
      transaction_id: 'tx1',
      transaction_hash: '0xhash',
      chain_id: UniverseChainId.Mainnet,
      request_nonce: 7,
      next_nonce: 7,
      provider_knows_tx: false,
      submit_via_private_rpc: true,
      private_rpc_provider: 'flashbots',
      reason: 'invalidation_check_false',
      age_ms: 1000,
    })
  })

  it('OMITS provider_knows_tx entirely when not measured (undefined)', () => {
    const transaction = {
      id: 'tx2',
      hash: '0xhash',
      chainId: UniverseChainId.Mainnet,
      addedTime: 100,
      options: { submitViaPrivateRpc: true },
    } as unknown as OnChainTransactionDetails

    const result = buildPendingTransactionStuckProperties({
      transaction,
      reason: 'poll_exhausted',
      nowMs: 1100,
    })
    // The key must be ABSENT (not present-but-undefined) so an analyst can't read it as a measurement.
    expect('provider_knows_tx' in result).toBe(false)
    expect(result).not.toHaveProperty('provider_knows_tx')
    expect(result.reason).toBe('poll_exhausted')
  })

  it('includes provider_knows_tx when explicitly measured as true', () => {
    const transaction = {
      id: 'tx3',
      hash: '0xhash',
      chainId: UniverseChainId.Mainnet,
      addedTime: 100,
      options: {},
    } as unknown as OnChainTransactionDetails

    const result = buildPendingTransactionStuckProperties({
      transaction,
      providerKnowsTx: true,
      reason: 'invalidation_check_false',
      nowMs: 1100,
    })
    expect(result.provider_knows_tx).toBe(true)
  })
})

describe('buildBacklogProperties', () => {
  it('counts private pending and computes oldest age', () => {
    expect(
      buildBacklogProperties({
        totalIncomplete: 5,
        privatePending: [{ addedTime: 100 }, { addedTime: 300 }],
        nowMs: 1100,
      }),
    ).toEqual({
      total_incomplete: 5,
      private_pending_count: 2,
      oldest_private_pending_age_ms: 1000,
    })
  })

  it('returns 0 oldest age when there are no private pending txs', () => {
    expect(buildBacklogProperties({ totalIncomplete: 3, privatePending: [], nowMs: 1100 })).toEqual({
      total_incomplete: 3,
      private_pending_count: 0,
      oldest_private_pending_age_ms: 0,
    })
  })
})

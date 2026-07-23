import { TradingApi } from '@universe/api'
import { hexToNumber, isValidHexString } from '@universe/encoding'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EthTransactionParams } from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import type { RpcUserOperation } from 'viem/account-abstraction'
import type { Address } from '~/chains'
import { sendUserOperationToBundler } from '~/connection/bundlerClient'

/**
 * Subset of EIP-5792 v2.0.0 `wallet_sendCalls` request fields we read. `chainId`
 * is hex-encoded per the spec.
 */
export interface WalletSendCallsRequest {
  version?: string
  from: string
  chainId: string
  calls: Array<{ to: string; data?: string; value?: string }>
  atomicRequired?: boolean
  capabilities?: {
    paymasterService?: { url: string; context?: Record<string, unknown> }
  }
}

/**
 * Handle an EIP-5792 `wallet_sendCalls` for the embedded wallet. Three branches:
 *  1. Sponsored (paymaster present) → encode as ERC-4337 PackedUserOperation
 *     via Trading API `encode_4337`, sign with the provider's `signUserOp`,
 *     submit to the EntryGateway bundler. Batch id = bundler-issued `userOpHash`.
 *  2. Non-sponsored, ANY number of calls → encode as a Calibur multicall via
 *     `sendTransaction` (which maps all calls into `encode_7702`).
 *     Batch id = on-chain `transactionHash`.
 *  3. Non-sponsored single-call without delegation → fall through to the
 *     existing `sendTransaction` flow (standard EIP-1559).
 *
 * The request is first validated against the wallet's active chain and connected
 * account (EIP-5792 4901 / §3.1): a UserOp encoded for one chain but signed
 * against another chain's EIP-712 domain would only fail later at bundler
 * submission, so mismatches are rejected up front. The provider's signing/sending
 * methods are injected so this stays free of class state and unit-testable (the
 * Trading API + bundler calls are module-level and mocked in tests).
 */
export async function sendEmbeddedWalletCalls(ctx: {
  params: WalletSendCallsRequest
  activeChainId: UniverseChainId
  account: Address
  signUserOp: (userOp: RpcUserOperation<'0.8'>) => Promise<RpcUserOperation<'0.8'>>
  sendTransaction: (transactions: EthTransactionParams[]) => Promise<unknown>
  // Optional: when omitted, no EIP-7702 authorization is bundled (the wallet is
  // assumed already delegated). The provider always supplies it; tests may omit.
  prepareDelegationAuth?: (
    sender: Address,
    chainId: UniverseChainId,
  ) => Promise<TradingApi.Eip7702Authorization | undefined>
}): Promise<{ id: string }> {
  const { params, activeChainId, account, signUserOp, sendTransaction, prepareDelegationAuth } = ctx

  // EIP-5792: `chainId` is hex-encoded.
  if (!isValidHexString(params.chainId)) {
    throw new Error(`wallet_sendCalls: chainId must be a hex string, received "${params.chainId}"`)
  }
  const chainId = hexToNumber(params.chainId) as UniverseChainId

  // EIP-5792 (4901): only the wallet's active chain can be used. The UserOp is
  // encoded + submitted for `chainId` but signed against the active chain's
  // EIP-712 domain, so a mismatch would fail signature verification at the
  // bundler — reject explicitly instead of failing late.
  if (chainId !== activeChainId) {
    throw new Error(
      `wallet_sendCalls: requested chain ${chainId} does not match the wallet's active chain ${activeChainId}`,
    )
  }

  // EIP-5792 §3.1: `from` (when supplied) must match the connected account. The
  // connected account is always what we actually sign with, so we use it below
  // rather than trusting the request value.
  if (
    params.from &&
    !areAddressesEqual({
      addressInput1: { address: params.from, platform: Platform.EVM },
      addressInput2: { address: account, platform: Platform.EVM },
    })
  ) {
    throw new Error(`wallet_sendCalls: from ${params.from} does not match the connected account`)
  }

  const paymasterService = params.capabilities?.paymasterService

  // Sponsored path → 4337 UserOp.
  if (paymasterService) {
    const tradingApiChainId = toTradingApiSupportedChainId(chainId)
    if (!tradingApiChainId) {
      throw new Error(`wallet_sendCalls: chain ${chainId} is not supported by the trading API`)
    }
    // Bundle the EIP-7702 delegation into the sponsored op: if the wallet isn't
    // delegated yet, sign the authorization up front and include it in
    // `encode_4337` so the paymaster + bundler simulate the account as delegated
    // (SWAP-2460). Undefined (and omitted) once the wallet is already delegated.
    const eip7702Auth = prepareDelegationAuth ? await prepareDelegationAuth(account, chainId) : undefined
    const encoded = await TradingApiClient.fetchWalletEncoding4337({
      calls: params.calls.map((call) => ({
        to: call.to,
        data: call.data ?? '0x',
        value: call.value ?? '0x0',
      })),
      sender: account,
      chainId: tradingApiChainId,
      paymasterUrl: paymasterService.url,
      paymasterServiceContext: paymasterService.context ?? {},
      ...(eip7702Auth ? { eip7702Auth } : {}),
    })

    const rpcUserOp = transformTradingApiUserOpToRpcUserOp(encoded.userOperation)
    const signedUserOp = await signUserOp(rpcUserOp)
    const userOpHash = await sendUserOperationToBundler(signedUserOp, chainId)
    return { id: userOpHash }
  }

  // Non-sponsored path → 7702 multicall through Calibur (or single-call EIP-1559
  // if not yet delegated). `sendTransaction` already handles both branches; we
  // just pass the full calls array through so multicall is atomic.
  const txParams: EthTransactionParams[] = params.calls.map((call) => ({
    from: account,
    to: call.to,
    data: call.data ?? '0x',
    value: call.value ?? '0x0',
  }))
  const txHash = await sendTransaction(txParams)
  if (!txHash || typeof txHash !== 'string') {
    throw new Error('wallet_sendCalls: sendTransaction returned no tx hash')
  }
  return { id: txHash }
}

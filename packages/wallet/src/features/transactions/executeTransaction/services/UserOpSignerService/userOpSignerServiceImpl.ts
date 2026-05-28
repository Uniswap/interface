import { ensure0xHex } from '@universe/encoding'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { type Address, encodeAbiParameters, pad } from 'viem'
import type { PublicClient } from 'viem'
import {
  entryPoint08Address,
  formatUserOperation,
  formatUserOperationRequest,
  getUserOperationTypedData,
  type RpcUserOperation,
} from 'viem/account-abstraction'
import type { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { createSignedAuthorization } from 'wallet/src/features/transactions/executeTransaction/eip7702Utils'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'
import type { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

const ROOT_KEY_HASH = pad('0x0', { size: 32 })

export function createBundledDelegationUserOpSignerService(ctx: {
  delegationInfo: DelegationCheckResult
  getAccount: () => SignerMnemonicAccountMeta
  getProvider: () => Promise<Provider>
  getViemClient: () => Promise<PublicClient>
  getSignerManager: () => SignerManager
}): UserOpSigner {
  const getSigner = async (): Promise<NativeSigner> => {
    const signerManager = ctx.getSignerManager()
    const signer = await signerManager.getSignerForAccount(ctx.getAccount())
    return signer.connect(await ctx.getProvider())
  }

  const signUserOp: UserOpSigner['signUserOp'] = async (
    rpcUserOp: RpcUserOperation<'0.8'>,
  ): Promise<RpcUserOperation<'0.8'>> => {
    const signer = await getSigner()
    const account = ctx.getAccount()
    const viemClient = await ctx.getViemClient()
    const chainId = await viemClient.getChainId()

    // Step 1: EIP-712 typed data signing over the PackedUserOperation

    // Convert hex RPC form → bigint native form for viem signing utilities
    // NOTE that eip7702Auth gets dropped in viem's formatUserOperation...
    const nativeUserOp = { ...formatUserOperation(rpcUserOp) }
    const typedData = getUserOperationTypedData({
      chainId,
      entryPointAddress: entryPoint08Address,
      userOperation: nativeUserOp,
    })

    if (!typedData.domain) {
      throw new Error('Typed data domain is required')
    }

    const rawSignature = ensure0xHex(
      await signTypedData({
        domain: typedData.domain,
        types: {
          PackedUserOperation: typedData.types.PackedUserOperation.map((field) => ({
            name: field.name,
            type: field.type,
          })),
        },
        value: typedData.message,
        signer,
      }),
    )

    // Step 2: Calibur signature encoding
    // Structure: abi.encode(keyHash, signature, hookData)
    // - keyHash: ROOT_KEY_HASH = bytes32(0)
    // - signature: 65 bytes ECDSA signature
    // - hookData: empty bytes
    const encodedUserOpSignature = encodeAbiParameters(
      [
        { type: 'bytes32', name: 'keyHash' },
        { type: 'bytes', name: 'signature' },
        { type: 'bytes', name: 'hookData' },
      ],
      [
        ROOT_KEY_HASH, // bytes32(0)
        rawSignature, // 65 bytes ECDSA signature
        '0x', // empty bytes
      ],
    )

    // Step 3: Attach 7702 authorization if the wallet still needs delegation.
    let eip7702Auth = rpcUserOp.eip7702Auth
    if (!eip7702Auth && ctx.delegationInfo.needsDelegation && ctx.delegationInfo.contractAddress) {
      // TODO(SWAP-2460): Revisit eip7702Auths and 4337 UserOp nonces; this should be already attached before the encode4337
      const authorizationNonce = await viemClient.getTransactionCount({
        address: account.address as Address,
      })
      const signedAuthorization = await createSignedAuthorization({
        signer,
        walletAddress: account.address as Address,
        chainId,
        contractAddress: ctx.delegationInfo.contractAddress as Address,
        nonce: authorizationNonce,
      })
      eip7702Auth = formatUserOperationRequest({ authorization: signedAuthorization }).eip7702Auth
    }

    // Step 4: Rebuild the final signed UserOperation.
    return { ...rpcUserOp, signature: encodedUserOpSignature, ...(eip7702Auth ? { eip7702Auth } : {}) }
  }

  const sendUserOp: UserOpSigner['sendUserOp'] = async (signedUserOp: RpcUserOperation<'0.8'>): Promise<string> => {
    const viemClient = await ctx.getViemClient()
    // Route bundler RPC through the same @universe/chains-managed viem transport
    // that handles every other chain RPC call. We use `transport.request` rather
    // than viem's typed `BundlerClient.sendUserOperation` because `signUserOp`
    // returns the userop in RPC (hex) form and viem's bundler actions take
    // native (bigint) form — the typed API would force a round-trip conversion
    // for no gain. The transport already applies UniRPC routing, session auth,
    // the 6s timeout, and emits rpcObserver telemetry tagged `provider:unirpc`.
    //
    // `transport.request` returns `unknown` because the method is off-schema
    // for a PublicClient. Validate the shape at the boundary rather than
    // casting blind — eth_sendUserOperation returns a userop hash string per
    // ERC-4337 spec; anything else is a backend contract violation we want
    // to surface here, not let propagate as a malformed hash downstream.
    const userOpHash = await viemClient.transport.request({
      method: 'eth_sendUserOperation',
      params: [signedUserOp, entryPoint08Address],
    })
    if (typeof userOpHash !== 'string') {
      throw new Error(`Bundler returned non-string userOpHash: ${typeof userOpHash}`)
    }
    return userOpHash
  }

  return { signUserOp, sendUserOp }
}

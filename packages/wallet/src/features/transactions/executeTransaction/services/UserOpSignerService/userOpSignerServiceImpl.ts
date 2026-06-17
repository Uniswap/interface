import { ensure0xHex, HexString } from '@universe/encoding'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { type Address, encodeAbiParameters, pad, toHex } from 'viem'
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
import type {
  PaymasterClient,
  RequestGasAndPaymasterAndDataParams,
} from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/paymasterClient'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'
import type { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

/**
 * Encodes a raw ECDSA signature into the Calibur format required by the AA module's
 * authorization scheme. This involves creating a bytes-encoded tuple of:
 *   - keyHash: ROOT_KEY_HASH = a consistent root key identifier (bytes32(0))
 *   - signature: the actual 65 byte ECDSA signature bytes
 *   - hookData: empty bytes
 */
function encodeCaliburUserOpSignature(ecdsaSignature: HexString): HexString {
  const ROOT_KEY_HASH = pad('0x0', { size: 32 })

  return encodeAbiParameters(
    [
      { type: 'bytes32', name: 'keyHash' },
      { type: 'bytes', name: 'signature' },
      { type: 'bytes', name: 'hookData' },
    ],
    [
      ROOT_KEY_HASH, // bytes32(0)
      ecdsaSignature, // 65 bytes ECDSA signature
      '0x', // empty bytes
    ],
  )
}

export function createBundledDelegationUserOpSignerService(ctx: {
  delegationInfo: DelegationCheckResult
  getAccount: () => SignerMnemonicAccountMeta
  getProvider: () => Promise<Provider>
  getViemClient: () => Promise<PublicClient>
  getSignerManager: () => SignerManager
  getPaymasterClient: () => PaymasterClient
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
    const encodedUserOpSignature = encodeCaliburUserOpSignature(rawSignature)

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

  const sponsorUniswapUserOp: UserOpSigner['sponsorUniswapUserOp'] = async ({
    initialUserOp,
    entryPoint,
    paymasterServiceContext,
    chainId,
  }): Promise<RpcUserOperation<'0.8'>> => {
    const sponsorship = paymasterServiceContext?.['sponsorship']
    if (sponsorship && typeof sponsorship === 'string') {
      const dummySignature = encodeCaliburUserOpSignature(`0x${'00'.repeat(65)}`)

      const params: RequestGasAndPaymasterAndDataParams = {
        entryPoint,
        dummySignature,
        userOperation: initialUserOp,
        sponsorship,
        chainIdHex: toHex(chainId),
        overrides: {
          // TODO(SWAP-2494): investigate Alchemy's callGasLimits returning low values
        },
      }

      const alchemyResult = await ctx.getPaymasterClient().requestGasAndPaymasterAndData(params)

      if (alchemyResult) {
        const { paymaster, paymasterData, paymasterPostOpGasLimit, paymasterVerificationGasLimit, ...userOpFields } =
          alchemyResult

        // Apply Alchemy's gas estimates regardless of sponsorship outcome.
        const userOpWithGas: RpcUserOperation<'0.8'> = {
          ...initialUserOp,
          ...(userOpFields.callGasLimit && {
            callGasLimit: userOpFields.callGasLimit,
          }),
          ...(userOpFields.verificationGasLimit && {
            verificationGasLimit: userOpFields.verificationGasLimit,
          }),
          ...(userOpFields.preVerificationGas && {
            preVerificationGas: userOpFields.preVerificationGas,
          }),
          ...(userOpFields.maxFeePerGas && {
            maxFeePerGas: userOpFields.maxFeePerGas,
          }),
          ...(userOpFields.maxPriorityFeePerGas && {
            maxPriorityFeePerGas: userOpFields.maxPriorityFeePerGas,
          }),
        }

        // UserOp is unsponsored, no paymaster
        if (!paymaster || !paymasterData) {
          return userOpWithGas
        }

        return {
          ...userOpWithGas,
          paymaster,
          paymasterData,
          ...(paymasterVerificationGasLimit && {
            paymasterVerificationGasLimit,
          }),
          ...(paymasterPostOpGasLimit && { paymasterPostOpGasLimit }),
        }
      }
    }

    return initialUserOp
  }

  const sendUserOp: UserOpSigner['sendUserOp'] = async (signedUserOp: RpcUserOperation<'0.8'>): Promise<string> => {
    const viemClient = await ctx.getViemClient()
    const userOpHash = await viemClient.transport.request({
      method: 'eth_sendUserOperation',
      params: [signedUserOp, entryPoint08Address],
    })
    if (typeof userOpHash !== 'string') {
      throw new Error(`Bundler returned non-string userOpHash: ${typeof userOpHash}`)
    }
    return userOpHash
  }

  return { signUserOp, sendUserOp, sponsorUniswapUserOp }
}

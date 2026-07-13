import { ensure0xHex } from '@universe/encoding'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { buildPackedUserOpTypedData } from 'uniswap/src/features/smartWallet/userOp/buildUserOpTypedData'
import { encodeCaliburUserOpSignature } from 'uniswap/src/features/smartWallet/userOp/caliburSignature'
import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { GasSponsorshipNotAppliedError } from 'uniswap/src/features/transactions/swap/errors'
import { toHex } from 'viem'
import type { PublicClient } from 'viem'
import { entryPoint08Address, type RpcUserOperation } from 'viem/account-abstraction'
import type { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import type {
  PaymasterClient,
  RequestGasAndPaymasterAndDataParams,
} from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/paymasterClient'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'
import type { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

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
    const viemClient = await ctx.getViemClient()
    const chainId = await viemClient.getChainId()

    // Step 1: EIP-712 typed data signing over the PackedUserOperation.
    const { domain, packedUserOperationFields, message } = buildPackedUserOpTypedData(rpcUserOp, chainId)

    const rawSignature = ensure0xHex(
      await signTypedData({
        domain,
        types: { PackedUserOperation: packedUserOperationFields },
        value: message,
        signer,
      }),
    )

    // Step 2: Calibur signature encoding
    const encodedUserOpSignature = encodeCaliburUserOpSignature(rawSignature)

    // Step 3: the 7702 auth is bundled into the 4337 request up front (round-trips on
    // `rpcUserOp.eip7702Auth`), never signed here — fail loudly if a delegation-needing userOp lacks it.
    if (ctx.delegationInfo.needsDelegation && !rpcUserOp.eip7702Auth) {
      throw new Error(
        'UserOp requires an EIP-7702 delegation authorization, but none was bundled into the request. ' +
          'The authorization must be attached before encode_4337/swap_4337, not at signing time.',
      )
    }

    // Step 4: Rebuild the final signed UserOperation (preserving any round-tripped eip7702Auth).
    return { ...rpcUserOp, signature: encodedUserOpSignature }
  }

  const sponsorUniswapUserOp: UserOpSigner['sponsorUniswapUserOp'] = async ({
    initialUserOp,
    entryPoint,
    paymasterServiceContext,
    chainId,
  }): Promise<RpcUserOperation<'0.8'>> => {
    // Only called when sponsorship is expected, so any failure to obtain it must throw.
    const sponsorship = paymasterServiceContext?.['sponsorship']
    if (!sponsorship || typeof sponsorship !== 'string') {
      throw new GasSponsorshipNotAppliedError('missing sponsorship token in paymaster context')
    }

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

    if (!alchemyResult) {
      throw new GasSponsorshipNotAppliedError('paymaster returned no result')
    }

    const { paymaster, paymasterData, paymasterPostOpGasLimit, paymasterVerificationGasLimit, ...userOpFields } =
      alchemyResult

    if (!paymaster || !paymasterData) {
      throw new GasSponsorshipNotAppliedError('paymaster did not return sponsorship data')
    }

    return {
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
      paymaster,
      paymasterData,
      ...(paymasterVerificationGasLimit && {
        paymasterVerificationGasLimit,
      }),
      ...(paymasterPostOpGasLimit && { paymasterPostOpGasLimit }),
    }
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

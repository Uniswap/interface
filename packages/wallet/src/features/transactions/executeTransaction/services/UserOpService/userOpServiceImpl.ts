import type { Logger } from 'utilities/src/logger/logger'
import { entryPoint08Address } from 'viem/account-abstraction'
import type { UserOpService } from 'wallet/src/features/transactions/executeTransaction/services/UserOpService/userOpService'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'

// TODO(SWAP-2525): Augment to handle pending userOps, failed userOps, analytics, notifs.
// May need to merge it into TransactionService as an executeUserOp method rather than duplicating service dependencies.

export function createUserOpService(ctx: { userOpSigner: UserOpSigner; logger: Logger }): UserOpService {
  const executeUserOp: UserOpService['executeUserOp'] = async (params): Promise<{ userOpHash: string }> => {
    // Step 1: If we need to request Uniswap gas sponsorship, fill paymaster fields here.
    // Sponsorship is required when requested: if the paymaster call fails, the error propagates
    // and the whole transaction fails (the user is shown an error) rather than silently signing
    // an unsponsored userOp.
    let userOpReadyToSign = params.userOp
    if (params.requestUniswapGasSponsorship === true && !params.userOp.paymaster) {
      ctx.logger.debug('UserOpService', 'executeUserOp', 'Requesting paymaster sponsorship', {
        chainId: params.chainId,
        account: params.account.address,
      })
      userOpReadyToSign = await ctx.userOpSigner.sponsorUniswapUserOp({
        initialUserOp: params.userOp,
        entryPoint: entryPoint08Address,
        paymasterServiceContext: params.paymasterServiceContext,
        chainId: params.chainId,
      })
    }

    // Step 2: Sign (EIP-712 + Calibur encoding)
    // TODO(SWAP-2460): eip7702Auth should be attached BEFORE the paymaster call
    const signedUserOp = await ctx.userOpSigner.signUserOp(userOpReadyToSign)

    ctx.logger.debug('UserOpService', 'executeUserOp', 'Submitting UserOp', {
      chainId: params.chainId,
      account: params.account.address,
      userOp: userOpReadyToSign,
    })

    // Step 3: Submit to bundler via UniRPC
    const userOpHash = await ctx.userOpSigner.sendUserOp(signedUserOp)

    ctx.logger.debug('UserOpService', 'executeUserOp', 'UserOp submitted', { userOpHash })

    return { userOpHash }
  }

  return { executeUserOp }
}

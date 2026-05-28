import type { Logger } from 'utilities/src/logger/logger'
import type { UserOpService } from 'wallet/src/features/transactions/executeTransaction/services/UserOpService/userOpService'
import type { UserOpSigner } from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'

// TODO(SWAP-2525): Augment to handle pending userOps, failed userOps, analytics, notifs.
// May need to merge it into TransactionService as an executeUserOp method rather than duplicating service dependencies.

export function createUserOpService(ctx: { userOpSigner: UserOpSigner; logger: Logger }): UserOpService {
  const executeUserOp: UserOpService['executeUserOp'] = async (params): Promise<{ userOpHash: string }> => {
    const signedUserOp = await ctx.userOpSigner.signUserOp(params.userOp)

    ctx.logger.debug('UserOpService', 'executeUserOp', 'Submitting UserOp', {
      chainId: params.chainId,
      account: params.account.address,
    })

    const userOpHash = await ctx.userOpSigner.sendUserOp(signedUserOp)

    ctx.logger.debug('UserOpService', 'executeUserOp', 'UserOp submitted', { userOpHash })

    return { userOpHash }
  }

  return { executeUserOp }
}

import type { RpcUserOperation } from 'viem/account-abstraction'

export interface UserOpSigner {
  signUserOp(userOp: RpcUserOperation<'0.8'>): Promise<RpcUserOperation<'0.8'>>
  sendUserOp(signed: RpcUserOperation<'0.8'>): Promise<string>
}

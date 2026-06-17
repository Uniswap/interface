import { UniverseChainId } from '@universe/chains'
import type { Address } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'

export type PaymasterFields = Pick<
  RpcUserOperation<'0.8'>,
  'paymaster' | 'paymasterData' | 'paymasterVerificationGasLimit' | 'paymasterPostOpGasLimit'
>

export interface UserOpSigner {
  signUserOp(userOp: RpcUserOperation<'0.8'>): Promise<RpcUserOperation<'0.8'>>
  sendUserOp(signed: RpcUserOperation<'0.8'>): Promise<string>
  // For Uniswap-initiated userops only. Requests paymaster sponsorship through our paymaster.
  sponsorUniswapUserOp(params: {
    initialUserOp: RpcUserOperation<'0.8'>
    entryPoint: Address
    chainId: UniverseChainId
    paymasterServiceContext?: Record<string, unknown>
  }): Promise<RpcUserOperation<'0.8'>>
}

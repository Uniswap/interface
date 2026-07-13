import { TradingApi } from '@universe/api'
import { parseHex, parseOptionalHex } from '@universe/encoding'
import { pad, type RpcAuthorization } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'

function transformEip7702Auth(auth: TradingApi.Eip7702Authorization): RpcAuthorization {
  return {
    address: parseHex(auth.address),
    chainId: parseHex(auth.chainId),
    nonce: parseHex(auth.nonce),
    // Pad r/s to a full 32 bytes: ECDSA r/s with a zero high byte can arrive as a
    // short (odd-length) value that strict RPCs reject ("value length was not even").
    r: pad(parseHex(auth.r), { size: 32 }),
    s: pad(parseHex(auth.s), { size: 32 }),
    yParity: parseHex(auth.yParity),
  }
}

/**
 * Transforms a Trading API ERC-4337 v0.8 `UserOperation` into viem's
 * `RpcUserOperation<'0.8'>` shape. Throws if any field is not a valid hex string.
 */
export function transformTradingApiUserOpToRpcUserOp(userOp: TradingApi.UserOperation): RpcUserOperation<'0.8'> {
  return {
    sender: parseHex(userOp.sender),
    nonce: parseHex(userOp.nonce),
    callData: parseHex(userOp.callData),
    callGasLimit: parseHex(userOp.callGasLimit),
    verificationGasLimit: parseHex(userOp.verificationGasLimit),
    preVerificationGas: parseHex(userOp.preVerificationGas),
    maxFeePerGas: parseHex(userOp.maxFeePerGas),
    maxPriorityFeePerGas: parseHex(userOp.maxPriorityFeePerGas),
    signature: parseHex(userOp.signature),
    factory: parseOptionalHex(userOp.factory),
    factoryData: parseOptionalHex(userOp.factoryData),
    paymaster: parseOptionalHex(userOp.paymaster),
    paymasterVerificationGasLimit: parseOptionalHex(userOp.paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: parseOptionalHex(userOp.paymasterPostOpGasLimit),
    paymasterData: parseOptionalHex(userOp.paymasterData),
    eip7702Auth: userOp.eip7702Auth ? transformEip7702Auth(userOp.eip7702Auth) : undefined,
  }
}

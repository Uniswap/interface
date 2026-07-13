import { TradingApi } from '@universe/api'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { pad } from 'viem'

describe(transformTradingApiUserOpToRpcUserOp, () => {
  const validUserOp: TradingApi.UserOperation = {
    sender: '0xabc',
    nonce: '0x01',
    callData: '0xdeadbeef',
    callGasLimit: '0x5208',
    verificationGasLimit: '0x9c40',
    preVerificationGas: '0x4e20',
    maxFeePerGas: '0x59682f00',
    maxPriorityFeePerGas: '0x3b9aca00',
    signature: '0x00',
  }

  it('maps every required and optional field, including eip7702Auth', () => {
    const userOp: TradingApi.UserOperation = {
      ...validUserOp,
      factory: '0xfac',
      factoryData: '0xfaca',
      paymaster: '0xfa11',
      paymasterVerificationGasLimit: '0x2710',
      paymasterPostOpGasLimit: '0x1388',
      paymasterData: '0xab',
      eip7702Auth: {
        address: '0xde1',
        chainId: '0x1',
        nonce: '0x2',
        r: '0xab',
        s: '0xcd',
        yParity: '0x0',
      },
    }

    expect(transformTradingApiUserOpToRpcUserOp(userOp)).toEqual({
      ...userOp,
      eip7702Auth: {
        ...userOp.eip7702Auth,
        // r/s are left-padded to a full 32 bytes
        r: pad('0xab', { size: 32 }),
        s: pad('0xcd', { size: 32 }),
      },
    })
  })

  it('leaves optional fields and eip7702Auth as undefined when absent', () => {
    const result = transformTradingApiUserOpToRpcUserOp(validUserOp)

    expect(result.factory).toBeUndefined()
    expect(result.factoryData).toBeUndefined()
    expect(result.paymaster).toBeUndefined()
    expect(result.paymasterVerificationGasLimit).toBeUndefined()
    expect(result.paymasterPostOpGasLimit).toBeUndefined()
    expect(result.paymasterData).toBeUndefined()
    expect(result.eip7702Auth).toBeUndefined()
  })

  it('throws when any field is not a 0x-prefixed hex string', () => {
    // Bare "10" is ambiguous between decimal 10 and 0x10 (= 16) — reject rather than silently corrupt.
    const userOp: TradingApi.UserOperation = { ...validUserOp, nonce: '10' }

    expect(() => transformTradingApiUserOpToRpcUserOp(userOp)).toThrow(/Invalid hex string: "10"/)
  })

  it('throws when a nested eip7702Auth field is malformed', () => {
    const userOp: TradingApi.UserOperation = {
      ...validUserOp,
      eip7702Auth: {
        address: '0xde1',
        chainId: 'not-hex',
        nonce: '0x2',
        r: '0xab',
        s: '0xcd',
        yParity: '0x0',
      },
    }

    expect(() => transformTradingApiUserOpToRpcUserOp(userOp)).toThrow(/Invalid hex string: "not-hex"/)
  })
})

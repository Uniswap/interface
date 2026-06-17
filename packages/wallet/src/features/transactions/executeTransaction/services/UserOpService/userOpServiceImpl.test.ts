import { AccountType, type SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Logger } from 'utilities/src/logger/logger'
import type { Address } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { entryPoint08Address } from 'viem/account-abstraction'
import { createUserOpService } from 'wallet/src/features/transactions/executeTransaction/services/UserOpService/userOpServiceImpl'
import type {
  PaymasterFields,
  UserOpSigner,
} from 'wallet/src/features/transactions/executeTransaction/services/UserOpSignerService/userOpSignerService'

function buildUserOp(overrides: Partial<RpcUserOperation<'0.8'>> = {}): RpcUserOperation<'0.8'> {
  return {
    sender: '0x1111111111111111111111111111111111111111',
    nonce: '0x0',
    callData: '0x',
    callGasLimit: '0x186a0',
    verificationGasLimit: '0x186a0',
    preVerificationGas: '0x5208',
    maxFeePerGas: '0x59682f00',
    maxPriorityFeePerGas: '0x59682f00',
    signature: '0x',
    ...overrides,
  } as RpcUserOperation<'0.8'>
}

describe('UserOpService', () => {
  const mockSignUserOp = jest.fn()
  const mockSendUserOp = jest.fn()
  const sponsorUniswapUserOp = jest.fn()
  const mockUserOpSigner: UserOpSigner = {
    signUserOp: mockSignUserOp,
    sendUserOp: mockSendUserOp,
    sponsorUniswapUserOp,
  }

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger

  const account: SignerMnemonicAccountMeta = {
    address: '0x1234567890123456789012345678901234567890',
    type: AccountType.SignerMnemonic,
  }

  const paymasterFields: PaymasterFields = {
    paymaster: '0x2222222222222222222222222222222222222222' as Address,
    paymasterData: '0xabcd',
    paymasterVerificationGasLimit: '0x186a0',
    paymasterPostOpGasLimit: '0x186a0',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSignUserOp.mockImplementation((userOp: RpcUserOperation<'0.8'>) =>
      Promise.resolve({ ...userOp, signature: '0xsigned' }),
    )
    mockSendUserOp.mockResolvedValue('0xuserophash')
    sponsorUniswapUserOp.mockImplementation(({ initialUserOp }) =>
      Promise.resolve({ ...initialUserOp, ...paymasterFields }),
    )
  })

  const createService = () =>
    createUserOpService({
      userOpSigner: mockUserOpSigner,
      logger: mockLogger,
    })

  describe('non-sponsored (gasSponsored omitted or false)', () => {
    it('should sign and submit without calling the paymaster when gasSponsored is omitted', async () => {
      const service = createService()
      const userOp = buildUserOp()

      const result = await service.executeUserOp({ userOp, chainId: UniverseChainId.Mainnet, account })

      expect(sponsorUniswapUserOp).not.toHaveBeenCalled()
      expect(mockSignUserOp).toHaveBeenCalledWith(userOp)
      expect(mockSendUserOp).toHaveBeenCalledTimes(1)
      expect(result.userOpHash).toBe('0xuserophash')
    })

    it('should skip the paymaster when gasSponsored is explicitly false', async () => {
      const service = createService()

      await service.executeUserOp({
        userOp: buildUserOp(),
        chainId: UniverseChainId.Mainnet,
        account,
        requestUniswapGasSponsorship: false,
      })

      expect(sponsorUniswapUserOp).not.toHaveBeenCalled()
      expect(mockSignUserOp).toHaveBeenCalledTimes(1)
    })
  })

  describe('dapp wallet_sendCalls (paymaster fields pre-filled server-side)', () => {
    it('should skip the paymaster when userOp already has paymaster fields, even if gasSponsored is true', async () => {
      const service = createService()
      const preFilledUserOp = buildUserOp({ paymaster: '0x3333333333333333333333333333333333333333' as Address })

      await service.executeUserOp({
        userOp: preFilledUserOp,
        chainId: UniverseChainId.Mainnet,
        account,
        requestUniswapGasSponsorship: true,
      })

      expect(sponsorUniswapUserOp).not.toHaveBeenCalled()
      expect(mockSignUserOp).toHaveBeenCalledWith(preFilledUserOp)
    })
  })

  describe('wallet-initiated sponsored flow (gasSponsored: true and userOp has no paymaster)', () => {
    it('should call the paymaster with the entry point before signing', async () => {
      const service = createService()
      const userOp = buildUserOp()

      await service.executeUserOp({
        userOp,
        chainId: UniverseChainId.Mainnet,
        account,
        requestUniswapGasSponsorship: true,
      })

      expect(sponsorUniswapUserOp).toHaveBeenCalledWith({
        initialUserOp: userOp,
        chainId: UniverseChainId.Mainnet,
        entryPoint: entryPoint08Address,
        paymasterServiceContext: undefined,
      })
      // Paymaster must be called BEFORE sign
      const sponsorOrder = sponsorUniswapUserOp.mock.invocationCallOrder[0]
      const signOrder = mockSignUserOp.mock.invocationCallOrder[0]
      expect(sponsorOrder).toBeDefined()
      expect(signOrder).toBeDefined()
      expect(sponsorOrder as number).toBeLessThan(signOrder as number)
    })

    it('should merge paymaster fields into the userOp before signing', async () => {
      const service = createService()
      const userOp = buildUserOp()

      await service.executeUserOp({
        userOp,
        chainId: UniverseChainId.Mainnet,
        account,
        requestUniswapGasSponsorship: true,
      })

      const signedArg = mockSignUserOp.mock.calls[0][0] as RpcUserOperation<'0.8'>
      expect(signedArg.sender).toBe(userOp.sender)
      expect(signedArg.nonce).toBe(userOp.nonce)
      expect(signedArg.callData).toBe(userOp.callData)
      expect(signedArg.callGasLimit).toBe(userOp.callGasLimit)
      expect(signedArg.paymaster).toBe(paymasterFields.paymaster)
      expect(signedArg.paymasterData).toBe(paymasterFields.paymasterData)
      expect(signedArg.paymasterVerificationGasLimit).toBe(paymasterFields.paymasterVerificationGasLimit)
      expect(signedArg.paymasterPostOpGasLimit).toBe(paymasterFields.paymasterPostOpGasLimit)
    })

    it('should submit the signed userOp and return the hash', async () => {
      const service = createService()

      const result = await service.executeUserOp({
        userOp: buildUserOp(),
        chainId: UniverseChainId.Mainnet,
        account,
        requestUniswapGasSponsorship: true,
      })

      expect(mockSendUserOp).toHaveBeenCalledTimes(1)
      expect(result.userOpHash).toBe('0xuserophash')
    })

    it('should propagate paymaster errors without signing', async () => {
      sponsorUniswapUserOp.mockRejectedValue(new Error('paymaster down'))
      const service = createService()

      await expect(
        service.executeUserOp({
          userOp: buildUserOp(),
          chainId: UniverseChainId.Mainnet,
          account,
          requestUniswapGasSponsorship: true,
        }),
      ).rejects.toThrow('paymaster down')

      expect(mockSignUserOp).not.toHaveBeenCalled()
      expect(mockSendUserOp).not.toHaveBeenCalled()
    })
  })
})

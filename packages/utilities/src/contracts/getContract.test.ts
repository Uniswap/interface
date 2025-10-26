import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { getContract } from 'utilities/src/contracts/getContract'
import { type Mock, vi } from 'vitest'

vi.mock('@ethersproject/contracts', () => ({
  Contract: vi.fn(),
}))

vi.mock('utilities/src/addresses/evm/evm', () => ({
  isEVMAddressWithChecksum: vi.fn(),
}))
const addressMock = isEVMAddressWithChecksum as unknown as Mock

describe('getContract', () => {
  const mockProvider = {
    getSigner: vi.fn().mockReturnValue({
      connectUnchecked: vi.fn(),
    }),
  } as unknown as JsonRpcProvider

  const mockABI = [{}]
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockAccount = '0xabcdefabcdefabcdefabcdefabcdefabcdef'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw an error if the address is invalid', () => {
    addressMock.mockReturnValue(false)

    expect(() => getContract({ address: 'invalid_address', ABI: mockABI, provider: mockProvider })).toThrow(
      `Invalid 'address' parameter 'invalid_address'.`,
    )
    expect(isEVMAddressWithChecksum).toHaveBeenCalledWith('invalid_address')
  })

  it('should throw an error if the address is AddressZero', () => {
    addressMock.mockReturnValue(true)

    expect(() => getContract({ address: AddressZero, ABI: mockABI, provider: mockProvider })).toThrow(
      `Invalid 'address' parameter '${AddressZero}'.`,
    )
  })

  it('should return a Contract instance with provider when no account is provided', () => {
    addressMock.mockReturnValue(true)

    getContract({ address: mockAddress, ABI: mockABI, provider: mockProvider })

    expect(Contract).toHaveBeenCalledWith(mockAddress, mockABI, mockProvider)
    expect(mockProvider.getSigner).not.toHaveBeenCalled()
  })

  it('should return a Contract instance with signer when account is provided', () => {
    addressMock.mockReturnValue(true)

    getContract({ address: mockAddress, ABI: mockABI, provider: mockProvider, account: mockAccount })

    expect(mockProvider.getSigner).toHaveBeenCalledWith(mockAccount)
    expect(mockProvider.getSigner().connectUnchecked).toHaveBeenCalled()

    expect(Contract).toHaveBeenCalledWith(mockAddress, mockABI, mockProvider.getSigner().connectUnchecked())
  })
})

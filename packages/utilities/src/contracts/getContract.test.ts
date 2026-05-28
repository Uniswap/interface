import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { isAddress } from 'utilities/src/addresses'
import { getContract } from 'utilities/src/contracts/getContract'

jest.mock('@ethersproject/contracts', () => ({
  Contract: jest.fn(),
}))

jest.mock('utilities/src/addresses', () => ({
  isAddress: jest.fn(),
}))
const addressMock = isAddress as jest.Mock

describe('getContract', () => {
  const mockProvider = {
    getSigner: jest.fn().mockReturnValue({
      connectUnchecked: jest.fn(),
    }),
  } as unknown as JsonRpcProvider

  const mockABI = [{}]
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockAccount = '0xabcdefabcdefabcdefabcdefabcdefabcdef'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error if the address is invalid', () => {
    addressMock.mockReturnValue(false)

    expect(() => getContract('invalid_address', mockABI, mockProvider)).toThrow(
      `Invalid 'address' parameter 'invalid_address'.`,
    )
    expect(isAddress).toHaveBeenCalledWith('invalid_address')
  })

  it('should throw an error if the address is AddressZero', () => {
    addressMock.mockReturnValue(true)

    expect(() => getContract(AddressZero, mockABI, mockProvider)).toThrow(
      `Invalid 'address' parameter '${AddressZero}'.`,
    )
  })

  it('should return a Contract instance with provider when no account is provided', () => {
    addressMock.mockReturnValue(true)

    getContract(mockAddress, mockABI, mockProvider)

    expect(Contract).toHaveBeenCalledWith(mockAddress, mockABI, mockProvider)
    expect(mockProvider.getSigner).not.toHaveBeenCalled()
  })

  it('should return a Contract instance with signer when account is provided', () => {
    addressMock.mockReturnValue(true)

    getContract(mockAddress, mockABI, mockProvider, mockAccount)

    expect(mockProvider.getSigner).toHaveBeenCalledWith(mockAccount)
    expect(mockProvider.getSigner().connectUnchecked).toHaveBeenCalled()

    expect(Contract).toHaveBeenCalledWith(mockAddress, mockABI, mockProvider.getSigner().connectUnchecked())
  })
})

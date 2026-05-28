import { renderHook } from '@testing-library/react-hooks'
import { useDerivedSendInfo } from 'state/send/hooks'
import { SendState } from 'state/send/SendContext'
import { useAddressFromEns, useENSName } from 'uniswap/src/features/ens/api'
import { useUnitagByAddress, useUnitagByName } from 'uniswap/src/features/unitags/hooks'
import { getAddress } from 'viem'

jest.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    chainId: 1,
    provider: {},
  }),
}))
jest.mock('hooks/useAccount', () => ({
  useAccount: () => '0xYourAccountAddress',
}))
jest.mock('state/multichain/useMultichainContext', () => ({
  ...jest.requireActual('state/multichain/useMultichainContext'),
  useMultichainContext: () => ({
    chainId: 1,
  }),
}))
jest.mock('hooks/useTransactionGasFee', () => ({
  ...jest.requireActual('hooks/useTransactionGasFee'),
  useTransactionGasFee: () => ({
    gasFee: {
      value: '1000000',
    },
  }),
  GasSpeed: {
    Normal: 'normal',
  },
}))
jest.mock('hooks/Tokens', () => ({
  useCurrency: () => undefined,
}))
jest.mock('hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: () => ({ formattedAmount: '100' }),
}))
jest.mock('lib/hooks/useCurrencyBalance', () => ({
  useCurrencyBalances: () => [undefined, undefined],
}))
jest.mock('utils/transfer', () => ({
  useCreateTransferTransaction: () => undefined,
}))
jest.mock('uniswap/src/features/ens/api', () => ({
  useENSName: jest.fn(),
  useAddressFromEns: jest.fn(),
}))
jest.mock('uniswap/src/features/unitags/hooks', () => ({
  useUnitagByAddress: jest.fn(),
  useUnitagByName: jest.fn(),
}))

describe('useDerivedSendInfo', () => {
  const defaultSendState: SendState = {
    exactAmountToken: '',
    exactAmountFiat: undefined,
    inputInFiat: false,
    inputCurrency: undefined,
    recipient: '',
    validatedRecipientData: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useENSName as jest.Mock).mockReturnValue({
      data: undefined,
    })
    ;(useAddressFromEns as jest.Mock).mockReturnValue({
      data: null,
    })
    ;(useUnitagByAddress as jest.Mock).mockReturnValue({
      unitag: undefined,
    })
    ;(useUnitagByName as jest.Mock).mockReturnValue({
      unitag: undefined,
    })
  })

  it('returns correct recipientData when user input is a valid vanilla address (non-ens or unitag)', () => {
    const validVanillaAddress = '0x123456789abcdef0000000000000000000000000'

    // This is the input state to the hook
    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: validVanillaAddress,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validVanillaAddress),
      ensName: undefined,
      unitag: undefined,
    })
  })

  it('returns undefined when input is an invalid address', () => {
    const invalidAddress = '0x123456789abcdef'

    // This is the input state to the hook
    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: invalidAddress,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual(undefined)
  })

  it('returns correct recipientData when input is an address with a reverse ENS lookup', () => {
    const validAddressWithENS = '0x123456789abcdef0000000000000000000000000'
    const ensName = 'my-reverse-ens.eth'

    ;(useENSName as jest.Mock).mockReturnValue({
      data: ensName,
    })

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: validAddressWithENS,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validAddressWithENS),
      ensName,
      unitag: undefined,
    })
  })

  it('returns correct recipientData when user inputs an ens name', () => {
    const validAddressWithENS = '0x123456789abcdef0000000000000000000000000'
    const ensName = 'my-forward-ens.eth'

    ;(useAddressFromEns as jest.Mock).mockReturnValue({
      data: validAddressWithENS,
    })

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: ensName,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validAddressWithENS),
      ensName,
      unitag: undefined,
    })
  })

  it('returns correct recipientData when user inputs a unitag name with an address', () => {
    const validAddressWithUnitag = '0x123456789abcdef0000000000000000000000000'
    const unitagName = 'myunitag'

    ;(useUnitagByName as jest.Mock).mockReturnValue({
      unitag: { address: { address: validAddressWithUnitag }, username: unitagName },
    })

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: unitagName,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validAddressWithUnitag),
      ensName: undefined,
      unitag: unitagName,
    })
  })

  it('returns correct recipientData when user inputs a unitag name with username via fallback', () => {
    const validAddressWithUnitag = '0x123456789abcdef0000000000000000000000000'
    const unitagName = 'myunitag'
    const fallbackUnitagName = 'myunitagfallackusername'

    ;(useUnitagByName as jest.Mock).mockReturnValue({
      unitag: { address: { address: validAddressWithUnitag } },
    })
    ;(useUnitagByAddress as jest.Mock).mockReturnValue({
      unitag: { username: fallbackUnitagName },
    })

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: unitagName,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validAddressWithUnitag),
      ensName: undefined,
      unitag: fallbackUnitagName,
    })
  })

  it('returns correct recipientData when user address has reverse ENS lookup and unitag', () => {
    const validAddressWithEnsAndUnitag = '0x123456789abcdef0000000000000000000000000'
    const fallbackUnitagName = 'myunitagfallackusername'
    const ensName = 'my-reverse-ens.eth'

    ;(useENSName as jest.Mock).mockReturnValue({
      data: ensName,
    })
    ;(useUnitagByName as jest.Mock).mockReturnValue({
      unitag: undefined,
    })
    ;(useUnitagByAddress as jest.Mock).mockReturnValue({
      unitag: { username: fallbackUnitagName },
    })

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: validAddressWithEnsAndUnitag,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual({
      address: getAddress(validAddressWithEnsAndUnitag),
      ensName,
      unitag: fallbackUnitagName,
    })
  })

  it('returns validated recipientData when it exists', () => {
    const validAddress = '0x123456789abcdef0000000000000000000000000'

    const validatedRecipientData = {
      address: '0x524451789abcdef0000000000000000000000000',
      ensName: 'my-validated-ens.eth',
      unitag: 'myvalidatedunitag',
    }

    const mockSendState: SendState = {
      ...defaultSendState,
      recipient: validAddress,
      validatedRecipientData,
    }

    const { result } = renderHook(() => useDerivedSendInfo(mockSendState))
    const info = result.current

    expect(info.recipientData).toEqual(validatedRecipientData)
  })
})

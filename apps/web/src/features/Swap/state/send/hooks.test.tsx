import { renderHook } from '@testing-library/react'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useAddressFromEns, useENSName } from 'uniswap/src/features/ens/api'
import { getAddress } from 'viem'
import type { Mock } from 'vitest'
import { useDerivedSendInfo } from '~/features/Swap/state/send/hooks'
import { SendState } from '~/features/Swap/state/send/SendContext'

vi.mock('~/hooks/useEthersProvider', () => ({
  useEthersProvider: () => ({}),
}))
vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => '0xYourAccountAddress',
}))
vi.mock('~/state/multichain/useMultichainContext', async () => {
  const actual = await vi.importActual('~/state/multichain/useMultichainContext')
  return {
    ...actual,
    useMultichainContext: () => ({
      chainId: 1,
    }),
  }
})
vi.mock('~/hooks/useTransactionGasFee', async () => {
  const actual = await vi.importActual('~/hooks/useTransactionGasFee')
  return {
    ...actual,
    useTransactionGasFee: () => ({
      gasFee: {
        value: '1000000',
      },
    }),
    GasSpeed: {
      Normal: 'normal',
    },
  }
})
vi.mock('~/hooks/Tokens', () => ({
  useCurrency: () => undefined,
}))
vi.mock('~/hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: () => ({ formattedAmount: '100' }),
}))
vi.mock('~/lib/hooks/useCurrencyBalance', () => ({
  useCurrencyBalances: () => [undefined, undefined],
}))
const mockUseCreateTransferTransaction = vi.fn(() => undefined)
vi.mock('~/utils/transfer', () => ({
  useCreateTransferTransaction: (...args: unknown[]) => mockUseCreateTransferTransaction(...args),
}))
vi.mock('uniswap/src/features/ens/api', () => ({
  useENSName: vi.fn(),
  useAddressFromEns: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery', () => ({
  useUnitagsAddressQuery: vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery', () => ({
  useUnitagsUsernameQuery: vi.fn(),
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
    vi.clearAllMocks()
    ;(useENSName as Mock).mockReturnValue({
      data: undefined,
    })
    ;(useAddressFromEns as Mock).mockReturnValue({
      data: null,
    })
    ;(useUnitagsAddressQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    })
    ;(useUnitagsUsernameQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
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

    ;(useENSName as Mock).mockReturnValue({
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

    ;(useAddressFromEns as Mock).mockReturnValue({
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

    ;(useUnitagsUsernameQuery as Mock).mockReturnValue({
      data: { address: validAddressWithUnitag, username: unitagName },
      isLoading: false,
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

    ;(useUnitagsUsernameQuery as Mock).mockReturnValue({
      data: { address: validAddressWithUnitag },
      isLoading: false,
    })
    ;(useUnitagsAddressQuery as Mock).mockReturnValue({
      data: { username: fallbackUnitagName },
      isLoading: false,
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

    ;(useENSName as Mock).mockReturnValue({
      data: ensName,
    })
    ;(useUnitagsUsernameQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    })
    ;(useUnitagsAddressQuery as Mock).mockReturnValue({
      data: { username: fallbackUnitagName },
      isLoading: false,
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


  it('uses inputCurrency.chainId for transfer when it differs from ambient wallet chain', () => {
    const mockCurrency = {
      chainId: 10,
      isNative: false,
      isToken: true,
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      decimals: 18,
      symbol: 'TEST',
      name: 'Test Token',
      equals: () => false,
      wrapped: undefined,
    } as unknown as Currency

    const mockSendState: SendState = {
      ...defaultSendState,
      inputCurrency: mockCurrency,
    }

    renderHook(() => useDerivedSendInfo(mockSendState))

    expect(mockUseCreateTransferTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: 10 }),
    )
  })

  it('falls back to multichain chainId when no inputCurrency is set', () => {
    const mockSendState: SendState = {
      ...defaultSendState,
      inputCurrency: undefined,
    }

    renderHook(() => useDerivedSendInfo(mockSendState))

    expect(mockUseCreateTransferTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: 1 }),
    )
  })
})

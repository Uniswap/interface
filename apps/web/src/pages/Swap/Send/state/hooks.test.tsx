import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAddressFromEns, useENSName } from 'uniswap/src/features/ens/api'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { Mock } from 'vitest'
import { getAddress } from '~/chains'
import { useDerivedSendInfo } from '~/pages/Swap/Send/state/hooks'
import { SendState } from '~/pages/Swap/Send/state/SendContext'

vi.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    chainId: 1,
    provider: {},
  }),
}))
vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => '0xYourAccountAddress',
}))
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
type TransferInfoArg = { chainId?: number; currencyAmount?: { quotient: { toString(): string } } }
const useCreateTransferTransactionMock = vi.fn((_transferInfo?: TransferInfoArg) => undefined)
vi.mock('~/utils/transfer', () => ({
  useCreateTransferTransaction: (transferInfo?: TransferInfoArg) => useCreateTransferTransactionMock(transferInfo),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))
const mockedUseCurrencyInfo = vi.mocked(useCurrencyInfo)
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

  it('passes the input currency chainId to the transfer transaction', () => {
    const worldChainCurrency = {
      chainId: 480,
      isNative: false,
      isToken: true,
      address: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
      decimals: 8,
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      equals: () => false,
    } as unknown as NonNullable<SendState['inputCurrency']>

    const mockSendState: SendState = {
      ...defaultSendState,
      inputCurrency: worldChainCurrency,
    }

    renderHook(() => useDerivedSendInfo(mockSendState))

    expect(useCreateTransferTransactionMock).toHaveBeenCalled()
    const transferInfo = useCreateTransferTransactionMock.mock.calls.at(-1)?.[0]
    expect(transferInfo).toMatchObject({ chainId: 480 })
  })

  describe('currency resolution', () => {
    const BNB_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
    // What the token selector hands over for BNB USDT when it is built from a v2 multichain token: the
    // parent's 6 decimals applied to the BNB deployment. Single-chain GetToken returns the real 18.
    const MULTICHAIN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 6, 'USDT', 'Tether USD')
    const GET_TOKEN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 18, 'USDT', 'Tether USD')

    const sendState: SendState = {
      ...defaultSendState,
      exactAmountToken: '1',
      inputCurrency: MULTICHAIN_BNB_USDT,
    }

    beforeEach(() => {
      mockedUseCurrencyInfo.mockReset()
    })

    it('parses the amount with the per-chain decimals, not the decimals the selector handed over', () => {
      mockedUseCurrencyInfo.mockReturnValue({ currency: GET_TOKEN_BNB_USDT } as CurrencyInfo)

      const { result } = renderHook(() => useDerivedSendInfo(sendState))

      expect(mockedUseCurrencyInfo).toHaveBeenCalledWith(`56-${BNB_USDT_ADDRESS}`)
      expect(result.current.inputCurrency?.decimals).toBe(18)
      // 1 USDT on BNB is 1e18 raw units. The selector's 6 decimals would have sent 1e6, i.e. 1e-12 USDT.
      expect(result.current.parsedTokenAmount?.quotient.toString()).toBe('1000000000000000000')
      expect(result.current.parsedTokenAmount?.currency.decimals).toBe(18)
      const transferInfo = useCreateTransferTransactionMock.mock.calls.at(-1)?.[0]
      expect(transferInfo?.chainId).toBe(56)
      expect(transferInfo?.currencyAmount?.quotient.toString()).toBe('1000000000000000000')
    })

    it('withholds the amount and the transfer while the per-chain currency is still resolving', () => {
      mockedUseCurrencyInfo.mockReturnValue(undefined)

      const { result } = renderHook(() => useDerivedSendInfo(sendState))

      expect(result.current.inputCurrency).toBeUndefined()
      expect(result.current.parsedTokenAmount).toBeUndefined()
      const transferInfo = useCreateTransferTransactionMock.mock.calls.at(-1)?.[0]
      expect(transferInfo?.chainId).toBe(56)
      expect(transferInfo?.currencyAmount).toBeUndefined()
    })
  })
})

import { act, renderHook } from '@testing-library/react'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { zeroAddress } from '~/chains'
import {
  AuctionInsufficientBalanceError,
  AuctionStartTimePassedError,
  AuctionXWalletMismatchError,
  useCreateAuctionSubmit,
} from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { MS_PER_DAY } from '~/pages/Liquidity/CreateAuction/utils/duration'

const WALLET = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

const mockMutateAsync = vi.fn()
const mockMutationState = { isPending: false }
vi.mock('uniswap/src/data/rest/auctions/useCreateAuctionMutation', () => ({
  useCreateAuctionMutation: () => ({ mutateAsync: mockMutateAsync, isPending: mockMutationState.isPending }),
}))

const mockValidate = vi.fn()
vi.mock('uniswap/src/features/transactions/swap/utils/trade', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/swap/utils/trade')>()
  return { ...actual, validateTransactionRequest: (...args: unknown[]) => mockValidate(...args) }
})

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const mockSendAnalyticsEvent = vi.fn()
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: (...args: unknown[]) => mockSendAnalyticsEvent(...args),
}))

type Params = Parameters<typeof useCreateAuctionSubmit>[0]

/** Minimal stand-in for the `Auction Create Failed` props the Review step would build. */
const FAILED_PROPS = { token_source: 'new', chain_id: 1, failed_step: 'build_request' } as NonNullable<
  ReturnType<NonNullable<Params['getCreateFailedProperties']>>
>

function buildableParams(overrides: Partial<Params> = {}): Params {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.commitTokenFormAndAdvance()
  // Relative to `now` so the past-start-time launch guard holds regardless of when the suite runs.
  actions.setStartTime(new Date(Date.now() + MS_PER_DAY))
  actions.setEndTime(new Date(Date.now() + 4 * MS_PER_DAY))
  actions.setFloorPrice('0.1')
  const { tokenForm, configureAuction, customizePool } = store.getState()
  return {
    tokenForm,
    configureAuction,
    customizePool,
    walletAddress: WALLET,
    currencyAddress: zeroAddress,
    ...overrides,
  }
}

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

/** Buildable params for an existing token (UNI) with a configured deposit of `depositRaw` base units. */
function existingTokenParams(depositRaw: string, overrides: Partial<Params> = {}): Params {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  const uni = new Token(UniverseChainId.Mainnet, UNI_ADDRESS, 18, 'UNI', 'Uniswap')
  actions.setTokenForm({
    mode: TokenMode.EXISTING,
    existingTokenCurrencyInfo: { currency: uni } as CurrencyInfo,
    description: '',
    xProfile: '',
    websiteLink: '',
    totalSupply: CurrencyAmount.fromRawAmount(uni, '1000000000000000000000000000'),
  })
  actions.commitTokenFormAndAdvance()
  actions.setStartTime(new Date(Date.now() + MS_PER_DAY))
  actions.setEndTime(new Date(Date.now() + 4 * MS_PER_DAY))
  actions.setFloorPrice('0.1')
  actions.setAuctionConfig({ auctionSupplyAmount: CurrencyAmount.fromRawAmount(uni, depositRaw) })
  const { tokenForm, configureAuction, customizePool } = store.getState()
  return {
    tokenForm,
    configureAuction,
    customizePool,
    walletAddress: WALLET,
    currencyAddress: zeroAddress,
    ...overrides,
  }
}

beforeEach(() => {
  mockMutateAsync.mockReset()
  mockValidate.mockReset()
  mockSendAnalyticsEvent.mockReset()
  mockMutationState.isPending = false
})

describe('useCreateAuctionSubmit', () => {
  it('is disabled until a wallet is connected', () => {
    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams({ walletAddress: undefined })))
    expect(result.current.isDisabled).toBe(true)
  })

  it('is enabled when wallet + committed config + times are present', () => {
    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams()))
    expect(result.current.isDisabled).toBe(false)
  })

  it('is disabled when the raise currency address is unresolved (e.g. no USDC on the chain)', () => {
    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams({ currencyAddress: undefined })))
    expect(result.current.isDisabled).toBe(true)
  })

  it('is disabled while the mutation is pending', () => {
    mockMutationState.isPending = true
    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams()))
    expect(result.current.isPending).toBe(true)
    expect(result.current.isDisabled).toBe(true)
  })

  it('errors without calling the mutation when the request is incomplete', async () => {
    const store = createCreateAuctionStore()
    store.getState().actions.setFloorPrice('0.1') // not committed, no times
    const { tokenForm, configureAuction, customizePool } = store.getState()
    const { result } = renderHook(() =>
      useCreateAuctionSubmit({
        tokenForm,
        configureAuction,
        customizePool,
        walletAddress: WALLET,
        currencyAddress: zeroAddress,
      }),
    )

    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(returned).toBeUndefined()
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('Auction configuration is incomplete')
  })

  it('errors without calling the mutation when the start time has already passed', async () => {
    const params = buildableParams()
    const pastParams: Params = {
      ...params,
      configureAuction: { ...params.configureAuction, startTime: new Date(Date.now() - 1000) },
    }
    const { result } = renderHook(() => useCreateAuctionSubmit(pastParams))

    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(returned).toBeUndefined()
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(AuctionStartTimePassedError)
  })

  it('errors without calling the mutation when the deposit exceeds the wallet balance', async () => {
    // Configured to deposit 1000 base units but the wallet only holds 600.
    const params = existingTokenParams('1000', { existingTokenWalletBalanceRaw: 600n })
    const { result } = renderHook(() => useCreateAuctionSubmit(params))

    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(returned).toBeUndefined()
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(AuctionInsufficientBalanceError)
  })

  it('errors without calling the mutation when the X verification is bound to a different wallet', async () => {
    const params = buildableParams({
      xVerification: {
        xVerificationToken: 'token-1',
        boundWalletAddress: '0x0000000000000000000000000000000000000001',
      },
    })
    const { result } = renderHook(() => useCreateAuctionSubmit(params))

    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(returned).toBeUndefined()
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(result.current.error).toBeInstanceOf(AuctionXWalletMismatchError)
  })

  it('submits when the X verification is bound to the connected wallet, comparing case-insensitively', async () => {
    mockMutateAsync.mockResolvedValue({
      transactions: [],
      predictedTokenAddress: '0xToken',
      predictedAuctionAddress: '0xAuction',
      atomicallyBundleable: true,
      requestId: 'req-1',
    })

    const params = buildableParams({
      xVerification: { xVerificationToken: 'token-1', boundWalletAddress: WALLET.toLowerCase() },
    })
    const { result } = renderHook(() => useCreateAuctionSubmit(params))

    await act(async () => {
      await result.current.onLaunch()
    })

    expect(mockMutateAsync).toHaveBeenCalledOnce()
    expect(result.current.error).toBeUndefined()
  })

  it('returns the validated result on success', async () => {
    const tx = { to: '0xto', from: WALLET, data: '0x', value: '0x0', chainId: 1 }
    mockMutateAsync.mockResolvedValue({
      transactions: [tx],
      predictedTokenAddress: '0xToken',
      predictedAuctionAddress: '0xAuction',
      atomicallyBundleable: true,
      requestId: 'req-1',
    })
    mockValidate.mockImplementation((req: unknown) => req)

    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams()))
    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(mockMutateAsync).toHaveBeenCalledOnce()
    expect(returned?.predictedTokenAddress).toBe('0xToken')
    expect(returned?.predictedAuctionAddress).toBe('0xAuction')
    expect(returned?.requestId).toBe('req-1')
    expect(result.current.error).toBeUndefined()
  })

  it('throws when a returned transaction fails validation', async () => {
    mockMutateAsync.mockResolvedValue({
      transactions: [{ to: '0xto', from: WALLET, data: '0x', value: '0x0', chainId: 1 }],
      predictedTokenAddress: '0xToken',
      predictedAuctionAddress: '0xAuction',
      atomicallyBundleable: false,
      requestId: 'req-1',
    })
    mockValidate.mockReturnValue(undefined) // invalid -> filtered out -> length mismatch

    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams()))
    await act(async () => {
      await result.current.onLaunch()
    })

    expect(result.current.error?.message).toBe('CreateAuction returned an invalid transaction request')
  })

  it('sets the error when the mutation rejects', async () => {
    mockMutateAsync.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams()))
    let returned: Awaited<ReturnType<typeof result.current.onLaunch>>
    await act(async () => {
      returned = await result.current.onLaunch()
    })

    expect(returned).toBeUndefined()
    expect(result.current.error?.message).toBe('boom')
  })

  it('fires Auction Create Failed (build_request) when the start time has passed', async () => {
    const getCreateFailedProperties = vi.fn(() => FAILED_PROPS)
    const params = buildableParams({ getCreateFailedProperties })
    const pastParams: Params = {
      ...params,
      configureAuction: { ...params.configureAuction, startTime: new Date(Date.now() - 1000) },
    }
    const { result } = renderHook(() => useCreateAuctionSubmit(pastParams))

    await act(async () => {
      await result.current.onLaunch()
    })

    expect(getCreateFailedProperties).toHaveBeenCalledWith({ failedStep: 'build_request', errorCode: undefined })
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.AuctionCreateFailed, FAILED_PROPS)
  })

  it('fires Auction Create Failed (create_auction_request) when the mutation rejects', async () => {
    mockMutateAsync.mockRejectedValue(new Error('boom'))
    const getCreateFailedProperties = vi.fn(() => FAILED_PROPS)

    const { result } = renderHook(() => useCreateAuctionSubmit(buildableParams({ getCreateFailedProperties })))
    await act(async () => {
      await result.current.onLaunch()
    })

    expect(getCreateFailedProperties).toHaveBeenCalledWith({
      failedStep: 'create_auction_request',
      errorCode: undefined,
    })
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.AuctionCreateFailed, FAILED_PROPS)
  })
})

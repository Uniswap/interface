import { CurrencyAmount } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse, GasFeeResult } from '@universe/api'
import { FeeType, TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import type { providers } from 'ethers/lib/ethers'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/consts'
import type { TransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/types'
import { UnknownSimulationError } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import type { SwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import {
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getShouldSkipSwapRequest,
  getSimulationError,
  processWrapResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { TokenApprovalInfo, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { DEFAULT_PROTOCOL_OPTIONS } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

// Mock the gating layer so we can drive the GasFeeOverrides flag per test
vi.mock('@universe/gating', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...mod,
    getFeatureFlag: vi.fn(),
  }
})

const mockPermitData = { fakePermitField: 'hi' } as unknown as TradingApi.NullablePermit

describe('processWrapResponse', () => {
  it('should process wrap response with gas fee result', () => {
    // Given
    const gasFeeResult: GasFeeResult = {
      value: '1000',
      displayValue: '0.001',
      isLoading: false,
      error: null,
      params: {
        gasLimit: '21000',
        maxFeePerGas: '100000000000',
        maxPriorityFeePerGas: '1000000000',
      },
    }
    const wrapTxRequest = {
      to: '0x123',
      value: '1000000',
    } as providers.TransactionRequest

    // When
    const result = processWrapResponse({ gasFeeResult, wrapTxRequest })

    // Then
    expect(result.gasFeeResult).toEqual(gasFeeResult)
    expect(result.txRequests?.[0]).toEqual({
      to: '0x123',
      value: '1000000',
      gasLimit: '21000',
      maxFeePerGas: '100000000000',
      maxPriorityFeePerGas: '1000000000',
    })
    expect(result.gasEstimate.wrapEstimate).toBe(gasFeeResult.gasEstimate)
    expect(result.swapRequestArgs).toBeUndefined()
  })
})

describe('processWrapResponse (smart contract unwrap fallback)', () => {
  it('should fallback to hardcoded gas limit when gas params are missing for a smart contract unwrap', async () => {
    // Reset modules to allow re-mocking
    vi.resetModules()

    // Mock the platform module before importing
    vi.doMock('@universe/environment', async () => {
      const actual = await vi.importActual<typeof import('@universe/environment')>('@universe/environment')
      return {
        ...actual,
        isWebApp: true,
      }
    })

    // Use dynamic imports to get modules with the mock applied
    const { processWrapResponse: mockedProcessWrapResponse } =
      await import('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils')

    const { WRAP_FALLBACK_GAS_LIMIT_IN_GWEI } =
      await import('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants')

    const gasFeeResult: GasFeeResult = {
      value: '1000',
      displayValue: '0.001',
      isLoading: false,
      error: null,
      params: undefined,
    }

    const wrapTxRequest = {
      to: '0x123',
      value: '1000000',
    } as providers.TransactionRequest

    const expectedGasLimit = WRAP_FALLBACK_GAS_LIMIT_IN_GWEI * 10e9

    const fallbackGasParams = { gasLimit: expectedGasLimit }

    const result = mockedProcessWrapResponse({
      gasFeeResult,
      wrapTxRequest,
      fallbackGasParams,
    })

    expect(result.txRequests?.[0]).toEqual(expect.objectContaining({ gasLimit: expectedGasLimit }))

    // Clean up by resetting mocks
    vi.resetModules()
    vi.doUnmock('@universe/environment')
  })
})

describe('createPrepareSwapRequestParams', () => {
  const swapQuoteResponse = {
    quote: {} as TradingApi.ClassicQuote,
    routing: TradingApi.Routing.CLASSIC,
    requestId: '123',
    permitData: mockPermitData,
  } satisfies ClassicQuoteResponse
  const signature = '0x123'
  const transactionSettings: TransactionSettingsState = {
    customDeadline: 1800,
    selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
    slippageWarningModalSeen: false,
    isV4HookPoolsEnabled: false,
    isSlippageDirty: false,
  }
  const alreadyApproved = true

  beforeEach(() => {
    vi.mocked(getFeatureFlag).mockReset()
  })

  it('should prepare swap request params for classic quote with gasStrategies when flag is OFF', () => {
    // Given
    vi.mocked(getFeatureFlag).mockReturnValue(false)
    const gasStrategy = DEFAULT_GAS_STRATEGY
    const prepareParams = createPrepareSwapRequestParams({
      gasStrategy,
    })

    // When
    const result = prepareParams({
      swapQuoteResponse,
      signature,
      transactionSettings,
      alreadyApproved,
    })

    // Then
    expect(result).toEqual({
      quote: swapQuoteResponse.quote,
      permitData: swapQuoteResponse.permitData,
      signature,
      simulateTransaction: true,
      deadline: expect.any(Number),
      refreshGasPrice: true,
      gasStrategies: [DEFAULT_GAS_STRATEGY],
      urgency: 'urgent',
    })
    expect(getFeatureFlag).toHaveBeenCalledWith(FeatureFlags.GasFeeOverrides)
  })

  it('sends only urgency (string form) when flag is ON and no overrides', () => {
    // Given
    vi.mocked(getFeatureFlag).mockReturnValue(true)
    const gasStrategy = DEFAULT_GAS_STRATEGY
    const prepareParams = createPrepareSwapRequestParams({
      gasStrategy,
    })

    // When
    const result = prepareParams({
      swapQuoteResponse,
      signature,
      transactionSettings,
      alreadyApproved,
    })

    // Then — no `gasStrategies` and urgency is the bare string
    expect(result).toEqual({
      quote: swapQuoteResponse.quote,
      permitData: swapQuoteResponse.permitData,
      signature,
      simulateTransaction: true,
      deadline: expect.any(Number),
      refreshGasPrice: true,
      urgency: 'urgent',
    })
    expect((result as { gasStrategies?: unknown }).gasStrategies).toBeUndefined()
  })

  it('sends urgency object form when flag is ON and overrides exist', () => {
    // Given
    vi.mocked(getFeatureFlag).mockReturnValue(true)
    const gasStrategy = DEFAULT_GAS_STRATEGY
    const prepareParams = createPrepareSwapRequestParams({
      gasStrategy,
      gasOverrides: { maxFeePerGas: '12000000000', gasLimit: '500000' },
    })

    // When
    const result = prepareParams({
      swapQuoteResponse,
      signature,
      transactionSettings,
      alreadyApproved,
    })

    // Then
    expect((result as { gasStrategies?: unknown }).gasStrategies).toBeUndefined()
    expect(result.urgency).toEqual({
      level: 'urgent',
      overrides: { maxFeePerGas: '12000000000', gasLimit: '500000' },
    })
  })
})

describe('getSimulationError', () => {
  it('should return error when simulation fails with SIMULATION_ERROR', () => {
    const swapQuote = {
      txFailureReasons: [TradingApi.TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as TradingApi.ClassicQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: false })

    expect(error).toBeInstanceOf(Error)
  })

  it('should ignore SIMULATION_ERROR when isRevokeNeeded is true', () => {
    const swapQuote = {
      txFailureReasons: [TradingApi.TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as TradingApi.ClassicQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: true })

    expect(error).toBeNull()
  })

  it('should return null for bridge quote', () => {
    const swapQuote = {} as TradingApi.BridgeQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: false })

    expect(error).toBeNull()
  })
})

describe('getShouldSkipSwapRequest', () => {
  const mockTrade = { trade: { quote: { permitData: null } } } as unknown as TradeWithStatus
  const mockTradeNeedingPermit = {
    trade: { quote: { permitData: { fakePermitField: 'hi' } } },
  } as unknown as TradeWithStatus
  const baseDerivedSwapInfo = {
    trade: mockTrade,
    currencyAmounts: {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '500'),
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '500'),
    },
    currencyBalances: {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '500'),
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '500'),
    },
    wrapType: WrapType.NotApplicable,
  } as unknown as DerivedSwapInfo
  const baseTokenApprovalInfo = {
    action: ApprovalAction.None,
    txRequest: null,
    cancelTxRequest: null,
  } as TokenApprovalInfo

  const baseValidInput = {
    derivedSwapInfo: baseDerivedSwapInfo,
    tokenApprovalInfo: baseTokenApprovalInfo,
    signature: undefined,
  }

  it('should return false for typical input', () => {
    const result = getShouldSkipSwapRequest(baseValidInput)

    expect(result).toBe(false)
  })

  it('should return true if a permit is needed but not provided', () => {
    // Given
    const input = {
      ...baseValidInput,
      derivedSwapInfo: {
        ...baseDerivedSwapInfo,
        trade: mockTradeNeedingPermit,
      },
    }

    // When
    const result = getShouldSkipSwapRequest(input)

    // Then
    expect(result).toBe(true)
  })

  it('should return false if a permit is needed and provided', () => {
    // Given
    const input = {
      ...baseValidInput,
      derivedSwapInfo: {
        ...baseDerivedSwapInfo,
        trade: mockTradeNeedingPermit,
      },
      signature: '0x123',
    }

    // When
    const result = getShouldSkipSwapRequest(input)

    // Then
    expect(result).toBe(false)
  })

  it('should return true when amount exceeds balance', () => {
    // Given
    const derivedSwapInfo = {
      ...baseDerivedSwapInfo,
      currencyAmounts: {
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC, '1000'),
        [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(DAI, '1000'),
      },
    } as unknown as DerivedSwapInfo

    // When
    const result = getShouldSkipSwapRequest({
      ...baseValidInput,
      derivedSwapInfo,
    })

    // Then
    expect(result).toBe(true)
  })

  it('should return true when unknown approval action is passed', () => {
    // Given
    const tokenApprovalInfo = {
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
    } as const

    // When
    const result = getShouldSkipSwapRequest({
      ...baseValidInput,
      tokenApprovalInfo,
    })

    // Then
    expect(result).toBe(true)
  })
})

describe('createProcessSwapResponse', () => {
  const gasStrategy = DEFAULT_GAS_STRATEGY
  const processSwapResponse = createProcessSwapResponse({ gasStrategy })

  it('should process successful swap response', () => {
    // Given
    const swapQuote = {
      gasFee: '1000',
      route: [],
    } as TradingApi.ClassicQuote

    const response = {
      requestId: '123',
      transactions: [
        {
          to: '0x123',
          data: '0x456',
          from: '0x123',
          value: '0',
          chainId: 1,
        },
      ],
      gasEstimate: {
        strategy: DEFAULT_GAS_STRATEGY,
        gasLimit: '21000',
        maxFeePerGas: '100000000000',
        maxPriorityFeePerGas: '1000000000',
        type: FeeType.EIP1559,
        gasFee: '1000',
      },
    } as const satisfies SwapData

    // When
    const result = processSwapResponse({
      response,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: mockPermitData,
      swapRequestParams: { quote: swapQuote },
      isRevokeNeeded: false,
    })

    // Then
    expect(result).toEqual({
      gasFeeResult: {
        value: '1000',
        displayValue: expect.any(String),
        isLoading: false,
        error: null,
      },
      txRequests: response.transactions,
      permitData: mockPermitData,
      gasEstimate: {
        swapEstimate: response.gasEstimate,
      },
      swapRequestArgs: { quote: swapQuote },
    })
  })

  it('should handle simulation error', () => {
    // Given
    const swapQuote = {
      gasFee: '1000',
      txFailureReasons: [TradingApi.TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as TradingApi.ClassicQuote

    // When
    const result = processSwapResponse({
      response: undefined,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: undefined,
      swapRequestParams: { quote: swapQuote },
      isRevokeNeeded: false,
    })

    // Then
    expect(result.gasFeeResult.error).toBeInstanceOf(UnknownSimulationError)
  })

  // The `hasOverrides` branch determines whether `displayValue` backs out the
  // gas-limit safety buffer. With overrides, the backend skipped that buffer
  // so we display the raw `gasFee`; without, we deflate by
  // `limitInflationFactor / displayLimitInflationFactor`.
  describe('hasOverrides', () => {
    const strategy = {
      ...DEFAULT_GAS_STRATEGY,
      limitInflationFactor: 1.15,
      displayLimitInflationFactor: 1,
    }
    const swapQuote = { gasFee: '1150', route: [] } as TradingApi.ClassicQuote

    it('deflates displayValue by limit inflation when hasOverrides is false', () => {
      const process = createProcessSwapResponse({ gasStrategy: strategy, hasOverrides: false })
      const result = process({
        response: undefined,
        error: null,
        swapQuote,
        isSwapLoading: false,
        permitData: undefined,
        swapRequestParams: undefined,
        isRevokeNeeded: false,
      })
      expect(result.gasFeeResult.value).toBe('1150')
      // 1150 * 1 / 1.15 = 1000
      expect(result.gasFeeResult.displayValue).toBe('1000')
    })

    it('returns raw gasFee as displayValue when hasOverrides is true', () => {
      const process = createProcessSwapResponse({ gasStrategy: strategy, hasOverrides: true })
      const result = process({
        response: undefined,
        error: null,
        swapQuote,
        isSwapLoading: false,
        permitData: undefined,
        swapRequestParams: undefined,
        isRevokeNeeded: false,
      })
      expect(result.gasFeeResult.value).toBe('1150')
      expect(result.gasFeeResult.displayValue).toBe('1150')
    })
  })
})

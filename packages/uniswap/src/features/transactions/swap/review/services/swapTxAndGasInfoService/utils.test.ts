import { CurrencyAmount } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse } from '@universe/api'
import { FeeType, TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/consts'
import type { TransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/types'
import { GasSponsorshipNotAppliedError } from 'uniswap/src/features/transactions/swap/errors'
import { UnknownSimulationError } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import type { SwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import {
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getShouldSkipSwapRequest,
  getSimulationError,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { type TokenApprovalInfo, type TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
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

  it('surfaces a sponsorship error when the quote promised sponsorship but the swap did not deliver it', () => {
    const swapQuote = { gasFee: '1000', route: [] } as TradingApi.ClassicQuote

    const response = {
      requestId: '123',
      transactions: [{ to: '0x123', data: '0x456', from: '0x123', value: '0', chainId: 1 }],
      requestUniswapGasSponsorship: false,
    } as const satisfies SwapData

    const result = processSwapResponse({
      response,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: undefined,
      swapRequestParams: { quote: swapQuote },
      isRevokeNeeded: false,
      sponsorshipExpected: true,
    })

    expect(result.gasFeeResult.error).toBeInstanceOf(GasSponsorshipNotAppliedError)
  })

  it('does not surface a sponsorship error when the quote promised sponsorship and the swap delivered it', () => {
    const swapQuote = { gasFee: '1000', route: [] } as TradingApi.ClassicQuote

    const response = {
      requestId: '123',
      transactions: [{ to: '0x123', data: '0x456', from: '0x123', value: '0', chainId: 1 }],
      requestUniswapGasSponsorship: true,
    } as const satisfies SwapData

    const result = processSwapResponse({
      response,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: undefined,
      swapRequestParams: { quote: swapQuote },
      isRevokeNeeded: false,
      sponsorshipExpected: true,
    })

    expect(result.gasFeeResult.error).toBeNull()
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

  // With overrides applied, the displayed network cost should be the tx max
  // cost (maxFeePerGas * gasLimit) so it matches the editor's "Max cost" row,
  // rather than the gas-service estimate (which prices the current base fee).
  describe('max cost display', () => {
    const swapQuote = { gasFee: '1000', route: [] } as TradingApi.ClassicQuote

    it('sets displayValue to maxFeePerGas * gasLimit from the swap tx when hasOverrides is true', () => {
      const response = {
        requestId: '123',
        transactions: [
          {
            to: '0x123',
            data: '0x456',
            from: '0x123',
            value: '0',
            chainId: 1,
            maxFeePerGas: '100000000000', // 100 GWEI
            gasLimit: '21000',
          },
        ],
      } as const satisfies SwapData

      const process = createProcessSwapResponse({ gasStrategy: DEFAULT_GAS_STRATEGY, hasOverrides: true })
      const result = process({
        response,
        error: null,
        swapQuote,
        isSwapLoading: false,
        permitData: undefined,
        swapRequestParams: undefined,
        isRevokeNeeded: false,
      })

      // `value` stays the estimate; `displayValue` is the max cost (100e9 * 21000).
      expect(result.gasFeeResult.value).toBe('1000')
      expect(result.gasFeeResult.displayValue).toBe('2100000000000000')
    })

    it('keeps the estimate-based displayValue when hasOverrides is false', () => {
      const response = {
        requestId: '123',
        transactions: [
          {
            to: '0x123',
            data: '0x456',
            from: '0x123',
            value: '0',
            chainId: 1,
            maxFeePerGas: '100000000000',
            gasLimit: '21000',
          },
        ],
      } as const satisfies SwapData

      const process = createProcessSwapResponse({ gasStrategy: DEFAULT_GAS_STRATEGY, hasOverrides: false })
      const result = process({
        response,
        error: null,
        swapQuote,
        isSwapLoading: false,
        permitData: undefined,
        swapRequestParams: undefined,
        isRevokeNeeded: false,
      })

      // No overrides → not the max cost; displayValue derives from the estimate.
      expect(result.gasFeeResult.displayValue).not.toBe('2100000000000000')
    })

    it('falls back to the estimate-based display when the tx carries no gas fields', () => {
      const response = {
        requestId: '123',
        transactions: [{ to: '0x123', data: '0x456', from: '0x123', value: '0', chainId: 1 }],
      } as const satisfies SwapData

      const process = createProcessSwapResponse({ gasStrategy: DEFAULT_GAS_STRATEGY, hasOverrides: true })
      const result = process({
        response,
        error: null,
        swapQuote,
        isSwapLoading: false,
        permitData: undefined,
        swapRequestParams: undefined,
        isRevokeNeeded: false,
      })

      // Max cost can't be computed (no maxFeePerGas/gasLimit) → falls back to the estimate.
      expect(result.gasFeeResult.displayValue).toBe('1000')
    })
  })
})

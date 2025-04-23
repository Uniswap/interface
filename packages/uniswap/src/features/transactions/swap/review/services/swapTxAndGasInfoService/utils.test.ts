import { CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers/lib/ethers'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { ClassicQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  BridgeQuote,
  ClassicQuote,
  CreateSwapResponse,
  QuoteResponse,
  Routing,
  TransactionFailureReason,
} from 'uniswap/src/data/tradingApi/__generated__/index'
import { FeeType, GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { TransactionSettingsContextState } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { UNKNOWN_SIM_ERROR } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import {
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getBridgeOrClassicQuoteResponse,
  getIsWrapApplicable,
  getShouldSkipSwapRequest,
  getSimulationError,
  processWrapResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  ApprovalAction,
  TokenApprovalInfo,
  Trade,
  TradeWithStatus,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { DEFAULT_PROTOCOL_OPTIONS } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

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
    expect(result.transactionRequest).toEqual({
      to: '0x123',
      value: '1000000',
      gasLimit: '21000',
      maxFeePerGas: '100000000000',
      maxPriorityFeePerGas: '1000000000',
    })
    expect(result.gasEstimate.wrapEstimates).toBe(gasFeeResult.gasEstimates)
    expect(result.swapRequestArgs).toBeUndefined()
  })
})

describe('createPrepareSwapRequestParams', () => {
  it('should prepare swap request params for classic quote', () => {
    // Given
    const activeGasStrategy = DEFAULT_GAS_STRATEGY
    const shadowGasStrategies: GasStrategy[] = []
    const v4SwapEnabled = true
    const prepareParams = createPrepareSwapRequestParams({
      activeGasStrategy,
      shadowGasStrategies,
      v4SwapEnabled,
    })

    const swapQuoteResponse = {
      quote: {} as ClassicQuote,
      routing: Routing.CLASSIC,
      requestId: '123',
      permitData: { fakePermitField: 'hi' },
    } satisfies ClassicQuoteResponse
    const signature = '0x123'
    const transactionSettings: TransactionSettingsContextState = {
      customDeadline: 1800,
      selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
      slippageWarningModalSeen: false,
      updateTransactionSettings: () => undefined,
    }
    const alreadyApproved = true

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
      urgency: undefined,
      v4Enabled: true,
    })
  })
})

describe('getSimulationError', () => {
  it('should return error when simulation fails with SIMULATION_ERROR', () => {
    const swapQuote = {
      txFailureReasons: [TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as ClassicQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: false })

    expect(error).toBeInstanceOf(Error)
  })

  it('should ignore SIMULATION_ERROR when isRevokeNeeded is true', () => {
    const swapQuote = {
      txFailureReasons: [TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as ClassicQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: true })

    expect(error).toBeNull()
  })

  it('should return null for bridge quote', () => {
    const swapQuote = {} as BridgeQuote

    const error = getSimulationError({ swapQuote, isRevokeNeeded: false })

    expect(error).toBeNull()
  })
})

describe('getBridgeOrClassicQuoteResponse', () => {
  it('should return classic quote response', () => {
    const quote = { routing: Routing.CLASSIC } as QuoteResponse

    const result = getBridgeOrClassicQuoteResponse({ quote })

    expect(result).toBe(quote)
  })

  it('should return bridge quote response', () => {
    const quote = { routing: Routing.BRIDGE } as QuoteResponse

    const result = getBridgeOrClassicQuoteResponse({ quote })

    expect(result).toBe(quote)
  })

  it('should return undefined for other routing types', () => {
    const quote = { routing: Routing.DUTCH_V2 } as QuoteResponse

    const result = getBridgeOrClassicQuoteResponse({ quote })

    expect(result).toBeUndefined()
  })
})

describe('getIsWrapApplicable', () => {
  it('should return true when wrap type is not NotApplicable', () => {
    const derivedSwapInfo = {
      wrapType: WrapType.Wrap,
      trade: { trade: { routing: Routing.CLASSIC } } as unknown as Trade,
    } as unknown as DerivedSwapInfo

    const result = getIsWrapApplicable({ derivedSwapInfo })

    expect(result).toBe(true)
  })

  it('should return true when trade is UniswapX Eth input', () => {
    const derivedSwapInfo = {
      wrapType: WrapType.NotApplicable,
      trade: { trade: { routing: Routing.DUTCH_V2, needsWrap: true } } as unknown as Trade,
    } as unknown as DerivedSwapInfo

    const result = getIsWrapApplicable({ derivedSwapInfo })

    expect(result).toBe(true)
  })

  it('should return false when trade is not UniswapX or a wrap', () => {
    const derivedSwapInfo = {
      wrapType: WrapType.NotApplicable,
      trade: { trade: { routing: Routing.CLASSIC } } as unknown as Trade,
    } as unknown as DerivedSwapInfo

    const result = getIsWrapApplicable({ derivedSwapInfo })

    expect(result).toBe(false)
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

  it('should return true when wrap is passed', () => {
    // Given
    const derivedSwapInfo = {
      ...baseDerivedSwapInfo,
      wrapType: WrapType.Wrap,
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
  const activeGasStrategy = DEFAULT_GAS_STRATEGY
  const processSwapResponse = createProcessSwapResponse({ activeGasStrategy })

  it('should process successful swap response', () => {
    // Given
    const swapQuote = {
      gasFee: '1000',
      route: [],
    } as ClassicQuote

    const response = {
      requestId: '123',
      swap: {
        to: '0x123',
        data: '0x456',
        from: '0x123',
        value: '0',
        chainId: 1,
      },
      gasEstimates: [
        {
          strategy: DEFAULT_GAS_STRATEGY,
          gasLimit: '21000',
          maxFeePerGas: '100000000000',
          maxPriorityFeePerGas: '1000000000',
          type: FeeType.EIP1559,
          gasFee: '1000',
        },
      ],
    } as const satisfies CreateSwapResponse

    // When
    const result = processSwapResponse({
      response,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: { fakePermitField: 'hi' },
      swapRequestParams: { quote: swapQuote, v4Enabled: false },
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
      transactionRequest: response.swap,
      permitData: { fakePermitField: 'hi' },
      gasEstimate: {
        swapEstimates: {
          activeEstimate: response.gasEstimates[0],
          shadowEstimates: [],
        },
        wrapEstimates: undefined,
      },
      swapRequestArgs: { quote: swapQuote, v4Enabled: false },
    })
  })

  it('should handle simulation error', () => {
    // Given
    const swapQuote = {
      gasFee: '1000',
      txFailureReasons: [TransactionFailureReason.SIMULATION_ERROR],
      route: [],
    } as ClassicQuote

    // When
    const result = processSwapResponse({
      response: undefined,
      error: null,
      swapQuote,
      isSwapLoading: false,
      permitData: undefined,
      swapRequestParams: { quote: swapQuote, v4Enabled: false },
      isRevokeNeeded: false,
    })

    // Then
    expect(result.gasFeeResult.error?.message).toBe(UNKNOWN_SIM_ERROR)
  })
})

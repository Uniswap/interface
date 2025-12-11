import { CurrencyAmount } from '@uniswap/sdk-core'
import type { ClassicQuoteResponse } from '@universe/api'
import { FeeType, TradingApi } from '@universe/api'
import type { providers } from 'ethers/lib/ethers'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DEFAULT_GAS_STRATEGY } from 'uniswap/src/features/gas/utils'
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
  it('should fallback to hardcoded gas limit when gas params are missing for a smart contract unwrap', () => {
    jest.isolateModules(() => {
      jest.doMock('utilities/src/platform', () => ({
        __esModule: true,
        ...jest.requireActual('utilities/src/platform'),
        isWebApp: true,
      }))

      const {
        processWrapResponse: mockedProcessWrapResponse,
      } = require('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils')

      const {
        WRAP_FALLBACK_GAS_LIMIT_IN_GWEI,
      } = require('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants')

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
    })
  })
})

describe('createPrepareSwapRequestParams', () => {
  it('should prepare swap request params for classic quote', () => {
    // Given
    const gasStrategy = DEFAULT_GAS_STRATEGY
    const prepareParams = createPrepareSwapRequestParams({
      gasStrategy,
    })

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
})

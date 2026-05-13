import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CreateClassicPositionRequest,
  CreatePositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import type { NormalizedApprovalData } from 'uniswap/src/data/apiClients/liquidityService/normalizeApprovalResponse'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { describe, expect, it } from 'vitest'
import { PositionState } from '~/features/Liquidity/Create/types'
import { generateLiquidityServiceCreateCalldataQueryParams } from '~/features/Liquidity/utils/generateLiquidityServiceCreateCalldata'
import { ETH_MAINNET } from '~/test-utils/constants'
import { PositionField } from '~/types/position'

const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

describe('generateLiquidityServiceCreateCalldataQueryParams', () => {
  describe('Common validation', () => {
    it('returns undefined when address is missing', () => {
      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: undefined,
          approvalCalldata: undefined,
          positionState: {
            protocolVersion: ProtocolVersion.V3,
            fee: {
              feeAmount: FeeAmount.MEDIUM,
              tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
              isDynamic: false,
            },
          },
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when currencyAmounts is undefined', () => {
      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState: {
            protocolVersion: ProtocolVersion.V3,
            fee: {
              feeAmount: FeeAmount.MEDIUM,
              tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
              isDynamic: false,
            },
          },
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: undefined,
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when TOKEN0 currency amount is missing', () => {
      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState: {
            protocolVersion: ProtocolVersion.V3,
            fee: {
              feeAmount: FeeAmount.MEDIUM,
              tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
              isDynamic: false,
            },
          },
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when displayCurrencies are invalid', () => {
      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState: {
            protocolVersion: ProtocolVersion.V3,
            fee: {
              feeAmount: FeeAmount.MEDIUM,
              tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
              isDynamic: false,
            },
          },
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: undefined, TOKEN1: undefined },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when protocol version is UNSPECIFIED', () => {
      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.UNSPECIFIED,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState: {
            protocolVersion: ProtocolVersion.V3,
            fee: {
              feeAmount: FeeAmount.MEDIUM,
              tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
              isDynamic: false,
            },
          },
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })
  })

  describe('V2 validation and building', () => {
    it('returns undefined when protocolVersion does not equal positionState version', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when the poolOrPair is undefined', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns CreateClassicPositionRequest with V2 position', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      expect(result).toBeInstanceOf(CreateClassicPositionRequest)
      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.walletAddress).toBe(ZERO_ADDRESS)
      expect(classicRequest.simulateTransaction).toBe(true)
      expect(classicRequest.independentToken?.tokenAddress).toBe(USDT.address)
      expect(classicRequest.independentToken?.amount).toBe('1000000000000000000')
      expect(classicRequest.dependentToken?.amount).toBe('1000000000000000000')
      expect(classicRequest.poolParameters?.token0Address).toBe(USDT.address)
      expect(classicRequest.poolParameters?.token1Address).toBe(ETH_MAINNET.wrapped.address)
    })

    it('sets simulateTransaction to false when approval data exists', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const approvalCalldata: NormalizedApprovalData = {
        token0Approval: { to: '0x123', data: '0xabc' } as any,
      }

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.simulateTransaction).toBe(false)
    })
  })

  describe('V3 validation and building', () => {
    it('returns undefined when protocolVersion does not equal positionState version', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when pool is undefined', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when ticks are undefined', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [undefined, tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns CreatePositionRequest with V3 position', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V3,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pool,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
        poolId: 'test-pool-id',
      })

      expect(result).toBeInstanceOf(CreatePositionRequest)
      const v3Request = result as CreatePositionRequest
      expect(v3Request.walletAddress).toBe(ZERO_ADDRESS)
      expect(v3Request.simulateTransaction).toBe(true)
      expect(v3Request.chainId).toBe(UniverseChainId.Mainnet)
      expect(v3Request.independentToken?.tokenAddress).toBe(USDT.address)
      expect(v3Request.independentToken?.amount).toBe('1000000000000000000')
      expect(v3Request.tickPrice.case).toBe('tickBounds')
      if (v3Request.tickPrice.case === 'tickBounds') {
        expect(v3Request.tickPrice.value.tickLower).toBe(tickSpaceLimits[0])
        expect(v3Request.tickPrice.value.tickUpper).toBe(tickSpaceLimits[1])
      }
    })

    it('includes initialPrice and initialDependentAmount when creating pool', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V3,
        creatingPoolOrPair: true, // Creating new pool
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pool,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      const v3Request = result as CreatePositionRequest
      expect(v3Request.pool.case).toBe('newPool')
      if (v3Request.pool.case === 'newPool') {
        expect(v3Request.pool.value.initialPrice).toBe(pool.sqrtRatioX96.toString())
      }
      expect(v3Request.dependentToken?.amount).toBe('1000000000000000000')
    })

    it('handles dynamic fees correctly', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: true, // Dynamic fee
        },
      }

      const pool = new V3Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V3,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pool,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
        poolId: 'test-pool-id',
      })

      expect(result).toBeInstanceOf(CreatePositionRequest)
      const v3Request = result as CreatePositionRequest
      expect(v3Request.pool.case).toBe('existingPool')
    })
  })

  describe('V4 validation and building', () => {
    it('returns undefined when protocolVersion does not equal positionState version', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pool = new V4Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        TICK_SPACINGS[FeeAmount.MEDIUM],
        '0x0000000000000000000000000000000000000000',
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when the poolOrPair is undefined', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V4,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      expect(
        generateLiquidityServiceCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: false,
          address: ZERO_ADDRESS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns CreatePositionRequest with V4 position', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V4,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
        hook: '0x0000000000000000000000000000000000000001',
      }

      const pool = new V4Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        TICK_SPACINGS[FeeAmount.MEDIUM],
        '0x0000000000000000000000000000000000000001',
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V4,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pool,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
        poolId: 'test-pool-id',
      })

      expect(result).toBeInstanceOf(CreatePositionRequest)
      const v4Request = result as CreatePositionRequest
      expect(v4Request.walletAddress).toBe(ZERO_ADDRESS)
      expect(v4Request.simulateTransaction).toBe(true)
      expect(v4Request.chainId).toBe(UniverseChainId.Mainnet)
      expect(v4Request.independentToken?.tokenAddress).toBe(USDT.address)
      expect(v4Request.independentToken?.amount).toBe('1000000000000000000')
      expect(v4Request.tickPrice.case).toBe('tickBounds')
      if (v4Request.tickPrice.case === 'tickBounds') {
        expect(v4Request.tickPrice.value.tickLower).toBe(tickSpaceLimits[0])
        expect(v4Request.tickPrice.value.tickUpper).toBe(tickSpaceLimits[1])
      }
    })

    it('includes initialPrice and initialDependentAmount when creating pool', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V4,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
        hook: '0x0000000000000000000000000000000000000002',
      }

      const pool = new V4Pool(
        USDT.wrapped,
        ETH_MAINNET.wrapped,
        FeeAmount.MEDIUM,
        TICK_SPACINGS[FeeAmount.MEDIUM],
        '0x0000000000000000000000000000000000000002',
        '2437312313659959819381354528',
        '10272714736694327408',
        -69633,
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V4,
        creatingPoolOrPair: true, // Creating new pool
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pool,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      const v4Request = result as CreatePositionRequest
      expect(v4Request.pool.case).toBe('newPool')
      if (v4Request.pool.case === 'newPool') {
        expect(v4Request.pool.value.initialPrice).toBe(pool.sqrtRatioX96.toString())
      }
      expect(v4Request.dependentToken?.amount).toBe('1000000000000000000')
    })
  })

  describe('Derived values', () => {
    it('correctly derives independentToken from independentField TOKEN0', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.independentToken?.tokenAddress).toBe(USDT.address)
    })

    it('correctly derives independentToken from independentField TOKEN1', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN1,
      })

      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.independentToken?.tokenAddress).toBe(ETH_MAINNET.wrapped.address)
    })

    it('sets simulateTransaction to false when permitData exists', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const approvalCalldata: NormalizedApprovalData = {
        v4BatchPermitData: { domain: {}, types: {}, values: {} } as any,
      }

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
      })

      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.simulateTransaction).toBe(false)
    })

    it('passes through slippageTolerance and customDeadline', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V2,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      const pair = new Pair(
        CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
        CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
      )

      const result = generateLiquidityServiceCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V2,
        creatingPoolOrPair: false,
        address: ZERO_ADDRESS,
        approvalCalldata: undefined,
        positionState,
        ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
        poolOrPair: pair,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET.wrapped },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
        },
        independentField: PositionField.TOKEN0,
        slippageTolerance: 0.5,
        customDeadline: 30,
      })

      const classicRequest = result as CreateClassicPositionRequest
      expect(classicRequest.slippageTolerance).toBe(0.5)
      expect(classicRequest.deadline).toBeDefined()
    })
  })
})

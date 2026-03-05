import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CheckApprovalLPResponse,
  CreateLPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  IndependentToken,
  Protocols,
  V2CreateLPPosition,
  V3CreateLPPosition,
  V4CreateLPPosition,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'
import { DYNAMIC_FEE_DATA, PositionState } from '~/components/Liquidity/Create/types'
import { generateLiquidityServiceCreateCalldataQueryParams } from '~/components/Liquidity/utils/generateLiquidityServiceCreateCalldata'
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

    it('returns CreateLPPositionRequest with V2 position', () => {
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

      expect(result).toBeInstanceOf(CreateLPPositionRequest)
      expect(result?.createLpPosition.case).toBe('v2CreateLpPosition')

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.walletAddress).toBe(ZERO_ADDRESS)
      expect(v2Position.protocols).toBe(Protocols.V2)
      expect(v2Position.simulateTransaction).toBe(true)
      expect(v2Position.chainId).toBe(UniverseChainId.Mainnet)
      expect(v2Position.independentToken).toBe(IndependentToken.TOKEN_0)
      expect(v2Position.independentAmount).toBe('1000000000000000000')
      expect(v2Position.defaultDependentAmount).toBe('1000000000000000000')
      expect(v2Position.position?.pool?.token0).toBe(USDT.address)
      expect(v2Position.position?.pool?.token1).toBe(ETH_MAINNET.wrapped.address)
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

      const approvalCalldata = new CheckApprovalLPResponse({
        token0Approval: { to: '0x123', data: '0xabc' },
      })

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

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.simulateTransaction).toBe(false)
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

    it('returns CreateLPPositionRequest with V3 position', () => {
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
      })

      expect(result).toBeInstanceOf(CreateLPPositionRequest)
      expect(result?.createLpPosition.case).toBe('v3CreateLpPosition')

      const v3Position = result?.createLpPosition.value as V3CreateLPPosition
      expect(v3Position.walletAddress).toBe(ZERO_ADDRESS)
      expect(v3Position.protocols).toBe(Protocols.V3)
      expect(v3Position.simulateTransaction).toBe(true)
      expect(v3Position.chainId).toBe(UniverseChainId.Mainnet)
      expect(v3Position.independentToken).toBe(IndependentToken.TOKEN_0)
      expect(v3Position.independentAmount).toBe('1000000000000000000')
      expect(v3Position.initialDependentAmount).toBeUndefined() // No initial price
      expect(v3Position.initialPrice).toBeUndefined()
      expect(v3Position.position?.tickLower).toBe(tickSpaceLimits[0])
      expect(v3Position.position?.tickUpper).toBe(tickSpaceLimits[1])
      expect(v3Position.position?.pool?.token0).toBe(USDT.address)
      expect(v3Position.position?.pool?.token1).toBe(ZERO_ADDRESS)
      expect(v3Position.position?.pool?.fee).toBe(FeeAmount.MEDIUM)
      expect(v3Position.position?.pool?.tickSpacing).toBe(TICK_SPACINGS[FeeAmount.MEDIUM])
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

      const v3Position = result?.createLpPosition.value as V3CreateLPPosition
      expect(v3Position.initialPrice).toBe(pool.sqrtRatioX96.toString())
      expect(v3Position.initialDependentAmount).toBe('1000000000000000000')
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
      })

      const v3Position = result?.createLpPosition.value as V3CreateLPPosition
      expect(v3Position.position?.pool?.fee).toBe(DYNAMIC_FEE_DATA.feeAmount)
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

    it('returns CreateLPPositionRequest with V4 position', () => {
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
      })

      expect(result).toBeInstanceOf(CreateLPPositionRequest)
      expect(result?.createLpPosition.case).toBe('v4CreateLpPosition')

      const v4Position = result?.createLpPosition.value as V4CreateLPPosition
      expect(v4Position.walletAddress).toBe(ZERO_ADDRESS)
      expect(v4Position.protocols).toBe(Protocols.V4)
      expect(v4Position.simulateTransaction).toBe(true)
      expect(v4Position.chainId).toBe(UniverseChainId.Mainnet)
      expect(v4Position.independentToken).toBe(IndependentToken.TOKEN_0)
      expect(v4Position.independentAmount).toBe('1000000000000000000')
      expect(v4Position.initialDependentAmount).toBeUndefined() // No initial price
      expect(v4Position.initialPrice).toBeUndefined()
      expect(v4Position.position?.tickLower).toBe(tickSpaceLimits[0])
      expect(v4Position.position?.tickUpper).toBe(tickSpaceLimits[1])
      expect(v4Position.position?.pool?.token0).toBe(USDT.address)
      expect(v4Position.position?.pool?.token1).toBe(ZERO_ADDRESS)
      expect(v4Position.position?.pool?.fee).toBe(FeeAmount.MEDIUM)
      expect(v4Position.position?.pool?.tickSpacing).toBe(TICK_SPACINGS[FeeAmount.MEDIUM])
      expect(v4Position.position?.pool?.hooks).toBe('0x0000000000000000000000000000000000000001')
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

      const v4Position = result?.createLpPosition.value as V4CreateLPPosition
      expect(v4Position.initialPrice).toBe(pool.sqrtRatioX96.toString())
      expect(v4Position.initialDependentAmount).toBe('1000000000000000000')
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

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.independentToken).toBe(IndependentToken.TOKEN_0)
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

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.independentToken).toBe(IndependentToken.TOKEN_1)
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

      const approvalCalldata = new CheckApprovalLPResponse({
        permitData: { case: 'permitBatchData', value: { domain: {}, types: {}, values: {} } },
      })

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

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.simulateTransaction).toBe(false)
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

      const v2Position = result?.createLpPosition.value as V2CreateLPPosition
      expect(v2Position.slippageTolerance).toBe(0.5)
      expect(v2Position.deadline).toBeDefined()
    })
  })
})

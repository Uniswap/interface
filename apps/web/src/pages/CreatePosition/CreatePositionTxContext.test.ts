import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, nearestUsableTick, TICK_SPACINGS, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { PositionState } from 'components/Liquidity/Create/types'
import {
  generateAddLiquidityApprovalParams,
  generateCreateCalldataQueryParams,
  generateCreatePositionTxRequest,
} from 'pages/CreatePosition/CreatePositionTxContext'
import { ETH_MAINNET } from 'test-utils/constants'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

const ACCOUNT_DETAILS: AccountDetails = {
  address: ZERO_ADDRESS,
  platform: Platform.EVM,
  accountType: AccountType.Readonly,
  walletMeta: {
    id: '1',
  },
}

const tickSpaceLimits = [
  nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
  nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[FeeAmount.MEDIUM]),
]

describe('generateAddLiquidityApprovalParams', () => {
  it('returns undefined when the currency amounts are undefined', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: '0x0000000000000000000000000000000000000000',
        protocolVersion: ProtocolVersion.V4,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: undefined,
      }),
    ).toBeUndefined()
  })

  it('returns undefined when the address is undefined', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: undefined,
        protocolVersion: ProtocolVersion.V4,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
      }),
    ).toBeUndefined()
  })

  it('returns undefined when the protocol version is unspecified', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: '0x0000000000000000000000000000000000000000',
        protocolVersion: ProtocolVersion.UNSPECIFIED,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
      }),
    ).toBeUndefined()
  })

  it('returns undefined when the display currencies are undefined', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: '0x0000000000000000000000000000000000000000',
        protocolVersion: ProtocolVersion.V4,
        displayCurrencies: { TOKEN0: undefined, TOKEN1: undefined },
      }),
    ).toBeUndefined()
  })

  it('returns approval params', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: '0x0000000000000000000000000000000000000000',
        protocolVersion: ProtocolVersion.V4,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
      }),
    ).toEqual({
      walletAddress: '0x0000000000000000000000000000000000000000',
      token0: USDT.address,
      token1: ZERO_ADDRESS,
      simulateTransaction: true,
      protocol: TradingApi.ProtocolItems.V4,
      generatePermitAsTransaction: undefined,
      amount0: '1000000000000000000',
      amount1: '1000000000000000000',
      chainId: UniverseChainId.Mainnet,
    })
  })

  it('returns approval params with permit as transaction', () => {
    expect(
      generateAddLiquidityApprovalParams({
        address: '0x0000000000000000000000000000000000000000',
        protocolVersion: ProtocolVersion.V4,
        displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        generatePermitAsTransaction: true,
      }),
    ).toEqual({
      walletAddress: '0x0000000000000000000000000000000000000000',
      token0: USDT.address,
      token1: ZERO_ADDRESS,
      simulateTransaction: true,
      protocol: TradingApi.ProtocolItems.V4,
      generatePermitAsTransaction: true,
      amount0: '1000000000000000000',
      amount1: '1000000000000000000',
      chainId: UniverseChainId.Mainnet,
    })
  })
})

describe('generateCreateCalldataQueryParams', () => {
  it('returns undefined when address is missing', () => {
    expect(
      generateCreateCalldataQueryParams({
        protocolVersion: ProtocolVersion.V3,
        creatingPoolOrPair: false,
        account: undefined,
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

  describe('V2', () => {
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
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
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
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns query params', () => {
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

      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: false,
          account: ACCOUNT_DETAILS,
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
        }),
      ).toEqual({
        walletAddress: ZERO_ADDRESS,
        simulateTransaction: true,
        protocol: TradingApi.ProtocolItems.V2,
        slippageTolerance: undefined,
        chainId: UniverseChainId.Mainnet,
        defaultDependentAmount: '1000000000000000000',
        independentAmount: '1000000000000000000',
        independentToken: TradingApi.IndependentToken.TOKEN_0,
        position: {
          pool: {
            token0: USDT.address,
            token1: ETH_MAINNET.wrapped.address,
          },
        },
      })
    })
  })

  describe('V3', () => {
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
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    it('returns undefined when the poolOrPair is undefined', () => {
      const positionState: PositionState = {
        protocolVersion: ProtocolVersion.V3,
        fee: {
          feeAmount: FeeAmount.MEDIUM,
          tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
          isDynamic: false,
        },
      }

      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

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

    it('returns query params', () => {
      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: false,
          account: ACCOUNT_DETAILS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT.wrapped, TOKEN1: ETH_MAINNET.wrapped },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toEqual({
        walletAddress: ZERO_ADDRESS,
        simulateTransaction: true,
        protocol: TradingApi.ProtocolItems.V3,
        slippageTolerance: undefined,
        chainId: UniverseChainId.Mainnet,
        initialDependentAmount: undefined,
        independentAmount: '1000000000000000000',
        independentToken: TradingApi.IndependentToken.TOKEN_0,
        initialPrice: undefined,
        position: {
          pool: {
            fee: FeeAmount.MEDIUM,
            hooks: undefined,
            tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
            token0: USDT.address,
            token1: ETH_MAINNET.wrapped.address,
          },
          tickLower: tickSpaceLimits[0],
          tickUpper: tickSpaceLimits[1],
        },
      })
    })

    it('returns query params with initial price', () => {
      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V3,
          creatingPoolOrPair: true,
          account: ACCOUNT_DETAILS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT.wrapped, TOKEN1: ETH_MAINNET.wrapped },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT.wrapped, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET.wrapped, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toEqual({
        walletAddress: ZERO_ADDRESS,
        simulateTransaction: true,
        protocol: TradingApi.ProtocolItems.V3,
        slippageTolerance: undefined,
        chainId: UniverseChainId.Mainnet,
        initialDependentAmount: '1000000000000000000',
        independentAmount: '1000000000000000000',
        independentToken: TradingApi.IndependentToken.TOKEN_0,
        initialPrice: '2437312313659959819381354528',
        position: {
          pool: {
            fee: FeeAmount.MEDIUM,
            hooks: undefined,
            tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
            token0: USDT.address,
            token1: ETH_MAINNET.wrapped.address,
          },
          tickLower: tickSpaceLimits[0],
          tickUpper: tickSpaceLimits[1],
        },
      })
    })
  })

  describe('V4', () => {
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
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
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
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: false,
          account: undefined,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: undefined,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          independentField: PositionField.TOKEN0,
        }),
      ).toBeUndefined()
    })

    const positionState: PositionState = {
      protocolVersion: ProtocolVersion.V4,
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
      ZERO_ADDRESS,
      '2437312313659959819381354528',
      '10272714736694327408',
      -69633,
    )

    it('returns query params', () => {
      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: false,
          account: ACCOUNT_DETAILS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toEqual({
        walletAddress: ZERO_ADDRESS,
        simulateTransaction: true,
        protocol: TradingApi.ProtocolItems.V4,
        slippageTolerance: undefined,
        chainId: UniverseChainId.Mainnet,
        initialDependentAmount: undefined,
        independentAmount: '1000000000000000000',
        independentToken: TradingApi.IndependentToken.TOKEN_0,
        initialPrice: undefined,
        position: {
          pool: {
            fee: FeeAmount.MEDIUM,
            hooks: undefined,
            tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
            token0: USDT.address,
            token1: ZERO_ADDRESS,
          },
          tickLower: tickSpaceLimits[0],
          tickUpper: tickSpaceLimits[1],
        },
      })
    })

    it('returns query params with initial price', () => {
      expect(
        generateCreateCalldataQueryParams({
          protocolVersion: ProtocolVersion.V4,
          creatingPoolOrPair: true,
          account: ACCOUNT_DETAILS,
          approvalCalldata: undefined,
          positionState,
          ticks: [tickSpaceLimits[0], tickSpaceLimits[1]],
          poolOrPair: pool,
          displayCurrencies: { TOKEN0: USDT, TOKEN1: ETH_MAINNET },
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
          independentField: PositionField.TOKEN0,
        }),
      ).toEqual({
        walletAddress: ZERO_ADDRESS,
        simulateTransaction: true,
        protocol: TradingApi.ProtocolItems.V4,
        slippageTolerance: undefined,
        chainId: UniverseChainId.Mainnet,
        initialDependentAmount: '1000000000000000000',
        independentAmount: '1000000000000000000',
        independentToken: TradingApi.IndependentToken.TOKEN_0,
        initialPrice: '2437312313659959819381354528',
        position: {
          pool: {
            fee: FeeAmount.MEDIUM,
            hooks: undefined,
            tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
            token0: USDT.address,
            token1: ZERO_ADDRESS,
          },
          tickLower: tickSpaceLimits[0],
          tickUpper: tickSpaceLimits[1],
        },
      })
    })
  })
})

describe('generateCreatePositionTxRequest', () => {
  const createCalldata = {
    create: {
      from: ZERO_ADDRESS,
      chainId: 1,
      to: ZERO_ADDRESS,
      value: '0',
      data: '0x',
    },
  }

  const approvalCalldata = {
    token0Approval: {
      to: ZERO_ADDRESS,
      chainId: 1,
      from: ZERO_ADDRESS,
      data: '0x',
      value: '0',
    },
    token1Approval: {
      to: ZERO_ADDRESS,
      chainId: 1,
      from: ZERO_ADDRESS,
      data: '0x',
      value: '0',
    },
    token0Cancel: {
      to: ZERO_ADDRESS,
      chainId: 1,
      from: ZERO_ADDRESS,
      data: '0x',
      value: '0',
    },
    token1Cancel: {
      to: ZERO_ADDRESS,
      chainId: 1,
      from: ZERO_ADDRESS,
      data: '0x',
      value: '0',
    },
    permitData: {
      domain: {
        name: 'Uniswap',
        version: '1',
        chainId: 1,
      },
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
      },
      values: {
        name: 'Uniswap',
        version: '1',
        chainId: 1,
      },
    },
  }

  it('returns undefined when the create calldata is undefined', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: undefined,
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when token0 or token1 are undefined', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: undefined,
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
      } as any),
    ).toBeUndefined()

    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: undefined,
        },
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when the approval calldata is invalid - token0', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        approvalCalldata: {
          token0Approval: {
            to: undefined,
            chainId: UniverseChainId.Mainnet,
          },
        },
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when the approval calldata is invalid - token1', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        approvalCalldata: {
          token1Approval: {
            to: undefined,
            chainId: UniverseChainId.Mainnet,
          },
        },
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when the approval calldata is invalid - token0 cancel', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        approvalCalldata: {
          token0Cancel: {
            to: undefined,
            chainId: UniverseChainId.Mainnet,
          },
        },
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when the approval calldata is invalid - token1 cancel', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        approvalCalldata: {
          token1Cancel: {
            to: undefined,
            chainId: UniverseChainId.Mainnet,
          },
        },
      } as any),
    ).toBeUndefined()
  })

  it('returns undefined when the permit request is invalid', () => {
    expect(
      generateCreatePositionTxRequest({
        createCalldata: {} as any,
        currencyAmounts: {
          TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
        },
        approvalCalldata: {
          permitData: {
            domain: undefined,
            types: undefined,
            values: undefined,
          },
        },
      } as any),
    ).toBeUndefined()
  })

  describe('V2', () => {
    it('returns tx request', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          protocolVersion: ProtocolVersion.V2,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        protocolVersion: ProtocolVersion.V2,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approveToken0Request: undefined,
        approveToken1Request: undefined,
        revokeToken0Request: undefined,
        revokeToken1Request: undefined,
        permit: undefined,
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V2,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        protocolVersion: ProtocolVersion.V2,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approvePositionTokenRequest: undefined,
        approveToken0Request: {
          ...approvalCalldata.token0Approval,
        },
        approveToken1Request: {
          ...approvalCalldata.token1Approval,
        },
        revokeToken0Request: {
          ...approvalCalldata.token0Cancel,
        },
        revokeToken1Request: {
          ...approvalCalldata.token1Cancel,
        },
        permit: {
          method: PermitMethod.TypedData,
          typedData: {
            ...approvalCalldata.permitData,
          },
        },
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })
  })

  describe('V3', () => {
    it('returns tx request', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          protocolVersion: ProtocolVersion.V3,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        protocolVersion: ProtocolVersion.V3,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approvePositionTokenRequest: undefined,
        approveToken0Request: undefined,
        approveToken1Request: undefined,
        revokeToken0Request: undefined,
        revokeToken1Request: undefined,
        permit: undefined,
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V3,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        protocolVersion: ProtocolVersion.V3,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approvePositionTokenRequest: undefined,
        approveToken0Request: {
          ...approvalCalldata.token0Approval,
        },
        approveToken1Request: {
          ...approvalCalldata.token1Approval,
        },
        revokeToken0Request: {
          ...approvalCalldata.token0Cancel,
        },
        revokeToken1Request: {
          ...approvalCalldata.token1Cancel,
        },
        permit: {
          method: PermitMethod.TypedData,
          typedData: {
            ...approvalCalldata.permitData,
          },
        },
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })
  })

  describe('V4', () => {
    it('returns tx request', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          protocolVersion: ProtocolVersion.V4,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        protocolVersion: ProtocolVersion.V4,
        createPositionRequestArgs: {
          batchPermitData: undefined,
        },
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approveToken0Request: undefined,
        approveToken1Request: undefined,
        revokeToken0Request: undefined,
        revokeToken1Request: undefined,
        permit: undefined,
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V4,
          poolOrPair: undefined,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        protocolVersion: ProtocolVersion.V4,
        createPositionRequestArgs: {
          batchPermitData: {
            ...approvalCalldata.permitData,
          },
        },
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approvePositionTokenRequest: undefined,
        approveToken0Request: {
          ...approvalCalldata.token0Approval,
        },
        approveToken1Request: {
          ...approvalCalldata.token1Approval,
        },
        revokeToken0Request: {
          ...approvalCalldata.token0Cancel,
        },
        revokeToken1Request: {
          ...approvalCalldata.token1Cancel,
        },
        permit: {
          method: PermitMethod.TypedData,
          typedData: {
            ...approvalCalldata.permitData,
          },
        },
        token0PermitTransaction: undefined,
        token1PermitTransaction: undefined,
        positionTokenPermitTransaction: undefined,
        txRequest: {
          from: ZERO_ADDRESS,
          chainId: 1,
          to: ZERO_ADDRESS,
          value: '0',
          data: '0x',
        },
      })
    })
  })
})

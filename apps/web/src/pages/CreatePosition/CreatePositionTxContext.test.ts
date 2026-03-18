import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  CheckApprovalLPResponse,
  CreateLPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { PermitBatch, PermitBatchData } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { generateCreatePositionTxRequest } from '~/pages/CreatePosition/CreatePositionTxContext'
import { ETH_MAINNET } from '~/test-utils/constants'

describe('generateCreatePositionTxRequest', () => {
  const createCalldata = new CreateLPPositionResponse({
    create: {
      from: ZERO_ADDRESS,
      chainId: 1,
      to: ZERO_ADDRESS,
      value: '0',
      data: '0x',
    },
  })

  const approvalCalldata = new CheckApprovalLPResponse({
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
      case: 'permitBatchData',
      value: new PermitBatchData({
        domain: {
          name: 'Uniswap',
          version: '1',
          chainId: 1,
        },
        types: {
          EIP712Domain: {
            fields: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
            ],
          },
        },
        values: new PermitBatch({
          details: [],
          spender: ZERO_ADDRESS,
          sigDeadline: '0',
        }),
      }),
    },
  })

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
          canBatchTransactions: false,
          createCalldata,
          protocolVersion: ProtocolVersion.V2,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        canBatchTransactions: false,
        delegatedAddress: null,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approveToken0Request: undefined,
        approveToken1Request: undefined,
        approvePositionTokenRequest: undefined,
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
        sqrtRatioX96: undefined,
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          canBatchTransactions: false,
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V2,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        canBatchTransactions: false,
        delegatedAddress: null,
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
            domain: approvalCalldata.permitData.value!.domain,
            types: approvalCalldata.permitData.value!.types,
            values: approvalCalldata.permitData.value!.values,
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
        sqrtRatioX96: undefined,
      })
    })
  })

  describe('V3', () => {
    it('returns tx request', () => {
      expect(
        generateCreatePositionTxRequest({
          canBatchTransactions: false,
          createCalldata,
          protocolVersion: ProtocolVersion.V3,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        canBatchTransactions: false,
        delegatedAddress: null,
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
        sqrtRatioX96: undefined,
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          canBatchTransactions: false,
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V3,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        canBatchTransactions: false,
        delegatedAddress: null,
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
            domain: approvalCalldata.permitData.value!.domain,
            types: approvalCalldata.permitData.value!.types,
            values: approvalCalldata.permitData.value!.values,
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
        sqrtRatioX96: undefined,
      })
    })
  })

  describe('V4', () => {
    it('returns tx request', () => {
      expect(
        generateCreatePositionTxRequest({
          canBatchTransactions: false,
          createCalldata,
          protocolVersion: ProtocolVersion.V4,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: false,
        canBatchTransactions: false,
        delegatedAddress: null,
        createPositionRequestArgs: undefined,
        action: {
          type: LiquidityTransactionType.Create,
          currency0Amount: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
          currency1Amount: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          liquidityToken: undefined,
        },
        approveToken0Request: undefined,
        approveToken1Request: undefined,
        approvePositionTokenRequest: undefined,
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
        sqrtRatioX96: undefined,
      })
    })

    it('returns tx request for all tx types', () => {
      expect(
        generateCreatePositionTxRequest({
          canBatchTransactions: false,
          createCalldata,
          approvalCalldata,
          protocolVersion: ProtocolVersion.V4,
          poolOrPair: undefined,
          delegatedAddress: null,
          currencyAmounts: {
            TOKEN0: CurrencyAmount.fromRawAmount(USDT, '1000000000000000000'),
            TOKEN1: CurrencyAmount.fromRawAmount(ETH_MAINNET, '1000000000000000000'),
          },
        }),
      ).toEqual({
        type: LiquidityTransactionType.Create,
        unsigned: true,
        canBatchTransactions: false,
        delegatedAddress: null,
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
            domain: approvalCalldata.permitData.value!.domain,
            types: approvalCalldata.permitData.value!.types,
            values: approvalCalldata.permitData.value!.values,
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
        sqrtRatioX96: undefined,
      })
    })
  })
})

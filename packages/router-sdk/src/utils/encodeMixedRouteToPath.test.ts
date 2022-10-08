import { CurrencyAmount, Ether, Token, WETH9 } from '@uniswap/sdk-core'
import { Pair } from '@teleswap/v2-sdk'
import { encodeSqrtRatioX96, FeeAmount, Pool } from '@uniswap/v3-sdk'
import { MixedRouteSDK } from '../entities/mixedRoute/route'
import { encodeMixedRouteToPath } from './encodeMixedRouteToPath'

describe('#encodeMixedRouteToPath', () => {
  const ETHER = Ether.onChain(1)
  const token0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 't2', 'token2')

  const weth = WETH9[1]

  const pool_0_1_medium = new Pool(token0, token1, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_2_low = new Pool(token1, token2, FeeAmount.LOW, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_0_weth = new Pool(token0, weth, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_weth = new Pool(token1, weth, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])

  const pair_0_1 = new Pair(CurrencyAmount.fromRawAmount(token0, '100'), CurrencyAmount.fromRawAmount(token1, '200'))
  const pair_1_2 = new Pair(CurrencyAmount.fromRawAmount(token1, '150'), CurrencyAmount.fromRawAmount(token2, '150'))
  const pair_0_weth = new Pair(CurrencyAmount.fromRawAmount(token0, '100'), CurrencyAmount.fromRawAmount(weth, '100'))
  const pair_1_weth = new Pair(CurrencyAmount.fromRawAmount(token1, '175'), CurrencyAmount.fromRawAmount(weth, '100'))
  const pair_2_weth = new Pair(CurrencyAmount.fromRawAmount(token2, '150'), CurrencyAmount.fromRawAmount(weth, '100'))

  const route_0_V3_1 = new MixedRouteSDK([pool_0_1_medium], token0, token1)
  const route_0_V3_1_V3_2 = new MixedRouteSDK([pool_0_1_medium, pool_1_2_low], token0, token2)
  const route_0_V3_weth = new MixedRouteSDK([pool_0_weth], token0, ETHER)
  const route_0_V3_1_V3_weth = new MixedRouteSDK([pool_0_1_medium, pool_1_weth], token0, ETHER)
  const route_weth_V3_0 = new MixedRouteSDK([pool_0_weth], ETHER, token0)
  const route_weth_V3_0_V3_1 = new MixedRouteSDK([pool_0_weth, pool_0_1_medium], ETHER, token1)

  const route_0_V2_1 = new MixedRouteSDK([pair_0_1], token0, token1)
  const route_0_V2_1_V2_2 = new MixedRouteSDK([pair_0_1, pair_1_2], token0, token2)
  const route_weth_V2_0 = new MixedRouteSDK([pair_0_weth], ETHER, token0)
  const route_weth_V2_0_V2_1 = new MixedRouteSDK([pair_0_weth, pair_0_1], ETHER, token1)
  const route_0_V2_weth = new MixedRouteSDK([pair_0_weth], token0, ETHER)
  const route_0_V2_1_V2_weth = new MixedRouteSDK([pair_0_1, pair_1_weth], token0, ETHER)

  const route_0_V3_1_V2_weth = new MixedRouteSDK([pool_0_1_medium, pair_1_weth], token0, ETHER)
  const route_0_V3_weth_V2_1_V2_2 = new MixedRouteSDK([pool_0_weth, pair_1_weth, pair_1_2], token0, token2)
  const route_0_V3_1_v3_weth_V2_2 = new MixedRouteSDK([pool_0_1_medium, pool_1_weth, pair_2_weth], token0, token2)

  describe('pure V3', () => {
    it('packs them for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_0_V3_1)).toEqual(
        '0x0000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002'
      )
    })

    it('packs them correctly for multihop exact input', () => {
      expect(encodeMixedRouteToPath(route_0_V3_1_V3_2)).toEqual(
        '0x0000000000000000000000000000000000000001000bb800000000000000000000000000000000000000020001f40000000000000000000000000000000000000003'
      )
    })

    it('wraps ether input for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_weth_V3_0)).toEqual(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000001'
      )
    })

    it('wraps ether input for exact input multihop', () => {
      expect(encodeMixedRouteToPath(route_weth_V3_0_V3_1)).toEqual(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000bb80000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002'
      )
    })

    it('wraps ether output for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_0_V3_weth)).toEqual(
        '0x0000000000000000000000000000000000000001000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })

    it('wraps ether output for exact input multihop', () => {
      expect(encodeMixedRouteToPath(route_0_V3_1_V3_weth)).toEqual(
        '0x0000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })
  })

  describe('pure V2', () => {
    it('packs them for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_0_V2_1)).toEqual(
        '0x00000000000000000000000000000000000000018000000000000000000000000000000000000000000002'
      )
    })

    it('packs them correctly for multihop exact input', () => {
      expect(encodeMixedRouteToPath(route_0_V2_1_V2_2)).toEqual(
        '0x000000000000000000000000000000000000000180000000000000000000000000000000000000000000028000000000000000000000000000000000000000000003'
      )
    })

    it('wraps ether input for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_weth_V2_0)).toEqual(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc28000000000000000000000000000000000000000000001'
      )
    })

    it('wraps ether input for exact input multihop', () => {
      expect(encodeMixedRouteToPath(route_weth_V2_0_V2_1)).toEqual(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc280000000000000000000000000000000000000000000018000000000000000000000000000000000000000000002'
      )
    })

    it('wraps ether output for exact input single hop', () => {
      expect(encodeMixedRouteToPath(route_0_V2_weth)).toEqual(
        '0x0000000000000000000000000000000000000001800000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })

    it('wraps ether output for exact input multihop', () => {
      expect(encodeMixedRouteToPath(route_0_V2_1_V2_weth)).toEqual(
        '0x00000000000000000000000000000000000000018000000000000000000000000000000000000000000002800000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })
  })

  describe('mixed route', () => {
    it('packs them for exact input v3 -> v2 with wrapped ether output', () => {
      expect(encodeMixedRouteToPath(route_0_V3_1_V2_weth)).toEqual(
        '0x0000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002800000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })

    it('packs them for exact input v3 -> v2 -> v2', () => {
      expect(encodeMixedRouteToPath(route_0_V3_weth_V2_1_V2_2)).toEqual(
        '0x0000000000000000000000000000000000000001000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc280000000000000000000000000000000000000000000028000000000000000000000000000000000000000000003'
      )
    })

    it('packs them for exact input v3 -> v3 -> v2', () => {
      expect(encodeMixedRouteToPath(route_0_V3_1_v3_weth_V2_2)).toEqual(
        '0x0000000000000000000000000000000000000001000bb80000000000000000000000000000000000000002000bb8c02aaa39b223fe8d0a0e5c4f27ead9083c756cc28000000000000000000000000000000000000000000003'
      )
    })
  })
})

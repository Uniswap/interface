import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { describe, expect, it } from 'vitest'

const TOKEN_0 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC', 'Abc')
const TOKEN_1 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF', 'Def')
const currency0Amount = CurrencyAmount.fromRawAmount(TOKEN_0, JSBI.BigInt(100))
const currency1Amount = CurrencyAmount.fromRawAmount(TOKEN_1, JSBI.BigInt(100))

const BASE_POSITION = {
  chainId: UniverseChainId.Mainnet as EVMUniverseChainId,
  status: PositionStatus.IN_RANGE,
  poolId: 'pool-id',
  currency0Amount,
  currency1Amount,
}

describe('getPositionUrl', () => {
  it('returns V2 url when version is V2', () => {
    const position: PositionInfo = {
      ...BASE_POSITION,
      version: ProtocolVersion.V2,
      liquidityToken: TOKEN_0,
      poolOrPair: new Pair(currency0Amount, currency1Amount),
      feeTier: undefined,
      v4hook: undefined,
      owner: undefined,
    }
    expect(getPositionUrl(position)).toBe(`/positions/v2/ethereum/${TOKEN_0.address}`)
  })

  it('returns V3 url when version is V3', () => {
    const position: PositionInfo = {
      ...BASE_POSITION,
      version: ProtocolVersion.V3,
      tokenId: '123',
      feeTier: {
        isDynamic: false,
        tickSpacing: 60,
        feeAmount: 10000,
      },
      v4hook: undefined,
      owner: 'owner',
    }
    expect(getPositionUrl(position)).toBe(`/positions/v3/ethereum/123`)
  })

  it('returns V4 url when version is V4', () => {
    const position: PositionInfo = {
      ...BASE_POSITION,
      version: ProtocolVersion.V4,
      tokenId: '456',
      owner: 'owner',
    }
    expect(getPositionUrl(position)).toBe('/positions/v4/ethereum/456')
  })

  it('appends entryPoint as a URL-encoded query param when provided', () => {
    const position: PositionInfo = {
      ...BASE_POSITION,
      version: ProtocolVersion.V4,
      tokenId: '456',
      owner: 'owner',
    }
    expect(getPositionUrl(position, { entryPoint: '/portfolio/pools' })).toBe(
      '/positions/v4/ethereum/456?entryPoint=%2Fportfolio%2Fpools',
    )
  })

  it('returns the bare path when entryPoint option is undefined', () => {
    const position: PositionInfo = {
      ...BASE_POSITION,
      version: ProtocolVersion.V4,
      tokenId: '456',
      owner: 'owner',
    }
    expect(getPositionUrl(position, {})).toBe('/positions/v4/ethereum/456')
  })
})

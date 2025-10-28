import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils/getPositionUrl'
import JSBI from 'jsbi'
import { TEST_TOKEN_1, TEST_TOKEN_2 } from 'test-utils/constants'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { describe, expect, it } from 'vitest'

const currency0Amount = CurrencyAmount.fromRawAmount(TEST_TOKEN_1, JSBI.BigInt(100))
const currency1Amount = CurrencyAmount.fromRawAmount(TEST_TOKEN_2, JSBI.BigInt(100))
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
      liquidityToken: TEST_TOKEN_1,
      poolOrPair: new Pair(currency0Amount, currency1Amount),
      feeTier: undefined,
      v4hook: undefined,
      owner: undefined,
    }
    expect(getPositionUrl(position)).toBe(`/positions/v2/ethereum/${TEST_TOKEN_1.address}`)
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
})

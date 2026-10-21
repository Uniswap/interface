import { isMessage } from '@bufbuild/protobuf'
import { ChainId, Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { GetWalletPositionsResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import {
  Position,
  PositionListCursor,
  PositionStatus,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { V2LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import {
  getGetWalletPositionsBalanceQueryOptions,
  getGetWalletPositionsQueryOptions,
} from 'uniswap/src/data/apiClients/liquidityService/queries/positionQueries'
import { WALLET_POSITIONS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/liquidityService/queryKeys'
import { jsonParse, jsonStringify } from 'utilities/src/serialization/json'
import { describe, expect, it, vi } from 'vitest'

describe(getGetWalletPositionsBalanceQueryOptions, () => {
  it('keys under the getWalletPositions prefix so existing positions invalidations cover it', () => {
    const client = { getWalletPositionsBalance: vi.fn() } as unknown as typeof V2LiquidityServiceClient

    const options = getGetWalletPositionsBalanceQueryOptions(client, {
      params: { walletAddress: '0xabc', chainIds: [ChainId.MAINNET] },
    })

    // Prefix-matching is element-wise, so the existing refetch/invalidate sites hit this entry
    // without a second call site to keep in sync.
    expect(options.queryKey.slice(0, WALLET_POSITIONS_QUERY_KEY_PREFIX.length)).toEqual([
      ...WALLET_POSITIONS_QUERY_KEY_PREFIX,
    ])
  })
})

describe(getGetWalletPositionsQueryOptions, () => {
  it('returns plain pages that survive the persister round-trip', async () => {
    const response = new GetWalletPositionsResponse({
      positions: [new Position({ version: Protocols.V3, status: PositionStatus.OPEN, updatedAt: BigInt(1700000000) })],
      nextCursor: new PositionListCursor({ chainId: 1, version: Protocols.V3, positionKey: 'key' }),
    })
    const client = {
      getWalletPositions: vi.fn().mockResolvedValue(response),
    } as unknown as typeof V2LiquidityServiceClient

    const options = getGetWalletPositionsQueryOptions(client, { params: { walletAddress: '0xabc' } })
    const queryFn = options.queryFn as (context: { pageParam: undefined }) => Promise<unknown>
    const page = await queryFn({ pageParam: undefined })

    // A raw Message would persist as wire-format JSON (enums as names) and restore unparseable.
    expect(isMessage(page)).toBe(false)
    expect(jsonParse(jsonStringify(page))).toMatchObject({
      positions: [{ version: Protocols.V3, status: PositionStatus.OPEN, updatedAt: BigInt(1700000000) }],
      nextCursor: { chainId: 1, version: Protocols.V3, positionKey: 'key' },
    })
  })
})

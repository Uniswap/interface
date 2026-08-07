import { QueryClient } from '@tanstack/react-query'
import { V1_TRADING_API_PATHS, type CheckPermissionsResponse } from '@universe/api'
import { getIsPermissionedTokenFromCache } from 'uniswap/src/data/apiClients/tradingApi/getIsPermissionedTokenFromCache'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const CHAIN_ID = 11155111
const PERMISSIONED_TOKEN = '0xbf56488c857A881ae7e3BED27Cf99c10A7Ab7e50'
const PERMISSIONED_TOKEN_2 = '0xb73055db2b3A3EaE87a331DD88e4a80b43602690'
const ADAPTER_TOKEN = '0xeF1dC9ABD8A7E073CFDDA453C775e7cE24e4A4C8'
const STANDARD_TOKEN = '0x1F46ea239595706960a9208897968b169db1b89c'

function seedPermissions(params: {
  queryClient: QueryClient
  tokens: string[]
  chainId: number
  response: CheckPermissionsResponse
}): void {
  const { queryClient, tokens, chainId, response } = params
  queryClient.setQueryData<CheckPermissionsResponse>(
    [
      ReactQueryCacheKey.TradingApi,
      V1_TRADING_API_PATHS.checkPermissions,
      { walletAddress: '0xwallet', tokens, chainId },
    ],
    response,
  )
}

const permissionedResponse: CheckPermissionsResponse = {
  requestId: 'req-1',
  results: [
    {
      token: PERMISSIONED_TOKEN,
      isPermissioned: true,
      isAllowlisted: true,
      adapterTokenAddress: ADAPTER_TOKEN,
      issuer: 'issuer',
    },
  ],
}

describe('getIsPermissionedTokenFromCache', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  it('returns true when a request token is permissioned on the chain', () => {
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(true)
  })

  it('matches case-insensitively', () => {
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({
        queryClient,
        tokenAddresses: [PERMISSIONED_TOKEN.toUpperCase()],
        chainId: CHAIN_ID,
      }),
    ).toBe(true)
  })

  it('returns true when only one of multiple request tokens is permissioned', () => {
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({
        queryClient,
        tokenAddresses: [STANDARD_TOKEN, PERMISSIONED_TOKEN],
        chainId: CHAIN_ID,
      }),
    ).toBe(true)
  })

  it('scans past a non-matching cache entry to find a permissioned match', () => {
    // A chain-mismatched entry for the same token, which must be skipped...
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: 1, response: permissionedResponse })
    // ...and a matching entry on the target chain, which the iteration must still reach.
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(true)
  })

  it('returns true when both request tokens are permissioned', () => {
    seedPermissions({
      queryClient,
      tokens: [PERMISSIONED_TOKEN, PERMISSIONED_TOKEN_2],
      chainId: CHAIN_ID,
      response: {
        requestId: 'req-3',
        results: [
          {
            token: PERMISSIONED_TOKEN,
            isPermissioned: true,
            isAllowlisted: true,
            adapterTokenAddress: ADAPTER_TOKEN,
            issuer: 'a',
          },
          {
            token: PERMISSIONED_TOKEN_2,
            isPermissioned: true,
            isAllowlisted: true,
            adapterTokenAddress: ADAPTER_TOKEN,
            issuer: 'b',
          },
        ],
      },
    })

    expect(
      getIsPermissionedTokenFromCache({
        queryClient,
        tokenAddresses: [PERMISSIONED_TOKEN, PERMISSIONED_TOKEN_2],
        chainId: CHAIN_ID,
      }),
    ).toBe(true)
  })

  it('returns false when the token is present but not permissioned', () => {
    seedPermissions({
      queryClient,
      tokens: [STANDARD_TOKEN],
      chainId: CHAIN_ID,
      response: { requestId: 'req-2', results: [{ token: STANDARD_TOKEN, isPermissioned: false }] },
    })

    expect(getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [STANDARD_TOKEN], chainId: CHAIN_ID })).toBe(
      false,
    )
  })

  it('returns false when the permissioned result is for a different chain', () => {
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: 1, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(false)
  })

  it('returns false when nothing is cached (fail closed)', () => {
    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(false)
  })

  it('returns true from the persisted known-permissioned cache when no /permissions entry exists', () => {
    // Simulates a cold form after a reload: the wallet-keyed /permissions query has not resolved,
    // but the token was confirmed permissioned in an earlier session and persisted.
    queryClient.setQueryData<boolean>(
      [ReactQueryCacheKey.PermissionedTokenStatus, CHAIN_ID, PERMISSIONED_TOKEN.toLowerCase()],
      true,
    )

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(true)
  })

  it('scopes the persisted known-permissioned cache by chain', () => {
    queryClient.setQueryData<boolean>(
      [ReactQueryCacheKey.PermissionedTokenStatus, 1, PERMISSIONED_TOKEN.toLowerCase()],
      true,
    )

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(false)
  })

  it('falls through to the live /permissions results when the persistent cache has no entry', () => {
    // No PermissionedTokenStatus entry exists; only the live session query knows.
    expect(
      queryClient.getQueryData([
        ReactQueryCacheKey.PermissionedTokenStatus,
        CHAIN_ID,
        PERMISSIONED_TOKEN.toLowerCase(),
      ]),
    ).toBeUndefined()
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: CHAIN_ID }),
    ).toBe(true)
  })

  it('returns false for empty token list or missing chainId', () => {
    seedPermissions({ queryClient, tokens: [PERMISSIONED_TOKEN], chainId: CHAIN_ID, response: permissionedResponse })

    expect(getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [], chainId: CHAIN_ID })).toBe(false)
    expect(getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [undefined], chainId: CHAIN_ID })).toBe(false)
    expect(
      getIsPermissionedTokenFromCache({ queryClient, tokenAddresses: [PERMISSIONED_TOKEN], chainId: undefined }),
    ).toBe(false)
  })
})

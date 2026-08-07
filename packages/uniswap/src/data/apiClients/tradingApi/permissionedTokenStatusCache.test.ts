import { QueryClient } from '@tanstack/react-query'
import { SharedQueryClient, type CheckPermissionsResult } from '@universe/api'
import {
  hasKnownPermissionedToken,
  seedKnownPermissionedTokens,
} from 'uniswap/src/data/apiClients/tradingApi/permissionedTokenStatusCache'
import { sharedDehydrateOptions } from 'uniswap/src/data/reactQuery/sharedDehydrateOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const CHAIN_ID = 11155111
const PERMISSIONED_TOKEN = '0xbf56488c857A881ae7e3BED27Cf99c10A7Ab7e50'
const STANDARD_TOKEN = '0x1F46ea239595706960a9208897968b169db1b89c'
const ADAPTER_TOKEN = '0xeF1dC9ABD8A7E073CFDDA453C775e7cE24e4A4C8'

const permissionedResult: CheckPermissionsResult = {
  token: PERMISSIONED_TOKEN,
  isPermissioned: true,
  isAllowlisted: true,
  adapterTokenAddress: ADAPTER_TOKEN,
  issuer: 'issuer',
}
const standardResult: CheckPermissionsResult = { token: STANDARD_TOKEN, isPermissioned: false }

describe('permissionedTokenStatusCache', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  describe('seedKnownPermissionedTokens', () => {
    it('records confirmed-permissioned tokens (lowercased) and skips non-permissioned ones', () => {
      seedKnownPermissionedTokens({ queryClient, chainId: CHAIN_ID, results: [permissionedResult, standardResult] })

      expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [PERMISSIONED_TOKEN] })).toBe(
        true,
      )
      // Non-permissioned tokens are never written, so absence falls back to the live query.
      expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [STANDARD_TOKEN] })).toBe(
        false,
      )
    })

    it('is idempotent', () => {
      seedKnownPermissionedTokens({ queryClient, chainId: CHAIN_ID, results: [permissionedResult] })
      seedKnownPermissionedTokens({ queryClient, chainId: CHAIN_ID, results: [permissionedResult] })

      expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [PERMISSIONED_TOKEN] })).toBe(
        true,
      )
    })
  })

  describe('hasKnownPermissionedToken', () => {
    beforeEach(() => {
      seedKnownPermissionedTokens({ queryClient, chainId: CHAIN_ID, results: [permissionedResult] })
    })

    it('matches case-insensitively', () => {
      expect(
        hasKnownPermissionedToken({
          queryClient,
          chainId: CHAIN_ID,
          tokenAddresses: [PERMISSIONED_TOKEN.toUpperCase()],
        }),
      ).toBe(true)
    })

    it('matches when only one of multiple tokens is known permissioned', () => {
      expect(
        hasKnownPermissionedToken({
          queryClient,
          chainId: CHAIN_ID,
          tokenAddresses: [STANDARD_TOKEN, PERMISSIONED_TOKEN],
        }),
      ).toBe(true)
    })

    it('is scoped by chain', () => {
      expect(hasKnownPermissionedToken({ queryClient, chainId: 1, tokenAddresses: [PERMISSIONED_TOKEN] })).toBe(false)
    })

    it('ignores undefined and empty inputs', () => {
      expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [undefined] })).toBe(false)
      expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [] })).toBe(false)
    })
  })

  // The header builder reads these entries on the first quote; they must survive a reload. This
  // verifies the SharedQueryClient defaults actually opt the entries into disk persistence via the
  // shared dehydrate allowlist, rather than relying on it implicitly.
  describe('persistence on SharedQueryClient', () => {
    afterEach(() => {
      SharedQueryClient.removeQueries({ queryKey: [ReactQueryCacheKey.PermissionedTokenStatus] })
    })

    it('a seeded permissioned-token entry passes shouldDehydrateQuery', () => {
      seedKnownPermissionedTokens({ queryClient: SharedQueryClient, chainId: CHAIN_ID, results: [permissionedResult] })

      const query = SharedQueryClient.getQueryCache().find({
        queryKey: [ReactQueryCacheKey.PermissionedTokenStatus, CHAIN_ID, PERMISSIONED_TOKEN.toLowerCase()],
        exact: true,
      })

      expect(query).toBeDefined()
      expect(query?.meta?.['persist']).toBe(true)
      expect(query?.gcTime).toBe(Infinity)

      const shouldDehydrateQuery = sharedDehydrateOptions?.shouldDehydrateQuery
      expect(shouldDehydrateQuery).toBeDefined()
      expect(shouldDehydrateQuery?.(query!)).toBe(true)
    })

    it('does not create an entry for a non-permissioned token', () => {
      seedKnownPermissionedTokens({ queryClient: SharedQueryClient, chainId: CHAIN_ID, results: [standardResult] })

      const query = SharedQueryClient.getQueryCache().find({
        queryKey: [ReactQueryCacheKey.PermissionedTokenStatus, CHAIN_ID, STANDARD_TOKEN.toLowerCase()],
        exact: true,
      })

      expect(query).toBeUndefined()
    })
  })
})

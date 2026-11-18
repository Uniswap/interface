import type { GetWalletsBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { selectTotalsByRequestedAddress } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletsBalances/getWalletsBalances'

const CHECKSUMMED_ADDRESS = '0xE0554a476A092703abdB3Ef35c80e0D76d32939F'
const LOWERCASE_ADDRESS = CHECKSUMMED_ADDRESS.toLowerCase()
const OTHER_ADDRESS = '0x1234567890123456789012345678901234567890'

function makeBalance({ address, totalUsd }: { address: string; totalUsd?: number }): WalletBalance {
  return {
    walletAccount: { platformAddresses: [{ platform: 1, address }] },
    total: totalUsd === undefined ? undefined : { valueUsd: totalUsd },
  } as unknown as WalletBalance
}

function makeResponse(balances: WalletBalance[]): GetWalletsBalancesResponse {
  return { balances } as unknown as GetWalletsBalancesResponse
}

describe('selectTotalsByRequestedAddress', () => {
  it('returns undefined when data is undefined', () => {
    expect(selectTotalsByRequestedAddress([OTHER_ADDRESS])(undefined)).toBeUndefined()
  })

  it('keys results by the requested address spelling, matching case-insensitively', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 123 })])
    expect(selectTotalsByRequestedAddress([LOWERCASE_ADDRESS])(response)).toEqual({
      [LOWERCASE_ADDRESS]: 123,
    })
  })

  it('maps every requested address regardless of response order', () => {
    const response = makeResponse([
      makeBalance({ address: OTHER_ADDRESS, totalUsd: 50 }),
      makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 123 }),
    ])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS, OTHER_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: 123,
      [OTHER_ADDRESS]: 50,
    })
  })

  it('maps a requested address missing from the response to undefined', () => {
    const response = makeResponse([makeBalance({ address: OTHER_ADDRESS, totalUsd: 50 })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: undefined,
    })
  })

  it('maps a wallet with an unset total (per-wallet BE failure) to undefined', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: undefined,
    })
  })

  it('preserves a zero balance as 0, not undefined', () => {
    const response = makeResponse([makeBalance({ address: CHECKSUMMED_ADDRESS, totalUsd: 0 })])
    expect(selectTotalsByRequestedAddress([CHECKSUMMED_ADDRESS])(response)).toEqual({
      [CHECKSUMMED_ADDRESS]: 0,
    })
  })
})

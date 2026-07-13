import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'
import { zeroAddress } from '~/chains'
import { buildCreateAuctionRequest } from '~/pages/Liquidity/CreateAuction/buildCreateAuctionRequest'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { PostAuctionLiquidityAllocationType, TokenMode } from '~/pages/Liquidity/CreateAuction/types'

const WALLET_ADDRESS = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'
const SALT = '0x4b8637a788454d5fdc1283dc54a4526524fdb200665d766c53183298b311cbf3'

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
/** UNI: 1e9 tokens × 1e18 decimals — a real existing-token total supply. */
const UNI_TOTAL_SUPPLY_RAW = '1000000000000000000000000000'

type Store = ReturnType<typeof createCreateAuctionStore>

/** Fresh store committed to defaults with valid start/end times — a buildable baseline. */
function buildableStore(): Store {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.commitTokenFormAndAdvance()
  actions.setStartTime(new Date('2026-06-15T00:00:00.000Z'))
  actions.setEndTime(new Date('2026-06-18T00:00:00.000Z'))
  actions.setFloorPrice('0.1')
  return store
}

/**
 * Buildable store for an existing token (UNI) where the creator deposits only `depositRaw`
 * of the token's large real total supply — mirrors auctioning a tiny slice of an existing token.
 */
function existingTokenStore(depositRaw: string): Store {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  const uni = new Token(UniverseChainId.Mainnet, UNI_ADDRESS, 18, 'UNI', 'Uniswap')
  actions.setTokenForm({
    mode: TokenMode.EXISTING,
    existingTokenCurrencyInfo: { currency: uni } as CurrencyInfo,
    description: '',
    xProfile: '',
    websiteLink: '',
    totalSupply: CurrencyAmount.fromRawAmount(uni, UNI_TOTAL_SUPPLY_RAW),
  })
  actions.commitTokenFormAndAdvance()
  actions.setStartTime(new Date('2026-06-15T00:00:00.000Z'))
  actions.setEndTime(new Date('2026-06-18T00:00:00.000Z'))
  actions.setFloorPrice('0.1')
  actions.setAuctionConfig({ auctionSupplyAmount: CurrencyAmount.fromRawAmount(uni, depositRaw) })
  return store
}

function build(store: Store): ReturnType<typeof buildCreateAuctionRequest> {
  const { tokenForm, configureAuction, customizePool } = store.getState()
  return buildCreateAuctionRequest({
    tokenForm,
    configureAuction,
    customizePool,
    walletAddress: WALLET_ADDRESS,
    currencyAddress: zeroAddress,
    salt: SALT,
  })
}

describe('buildCreateAuctionRequest', () => {
  // The floor price is captured as a raw dot-decimal string; in the default floorPrice+raise
  // mode the input is parent-controlled and stores the typed value verbatim (e.g. `.1`). The
  // backend's decimal parser rejects a missing integer part or a trailing dot, so the request
  // builder must canonicalize before sending.
  describe('floor price canonicalization', () => {
    it.each([
      ['.1', '0.1'],
      ['1.', '1'],
      ['0.1', '0.1'],
      ['1', '1'],
      // string-level normalization preserves precision the float roundtrip would lose
      ['0.000000000000000004', '0.000000000000000004'],
    ])('maps floor price %j to %j', (input, expected) => {
      const store = buildableStore()
      store.getState().actions.setFloorPrice(input)
      expect(build(store)?.auction?.floorPriceRaisePerToken).toBe(expected)
    })
  })

  it('deposits the full minted supply of a new token and omits returnedSupply when fully auctioned', () => {
    const store = buildableStore()
    const request = build(store)
    const committed = store.getState().configureAuction.committed
    const mintedTotalSupply = committed?.totalSupply.quotient.toString()
    const newTokenTotalSupply =
      request?.tokenInfo?.source?.case === 'newToken' ? request.tokenInfo.source.value.totalSupply : undefined

    // A new token mints its full supply and deposits all of it. The backend derives the sold amount
    // as auctionSupply − reservedSupplyForLp − returnedSupply.
    expect(request?.auction?.auctionSupply).toBe(mintedTotalSupply)
    expect(newTokenTotalSupply).toBe(mintedTotalSupply)
    expect(BigInt(request?.pool?.reservedSupplyForLp ?? '0')).toBeLessThan(BigInt(mintedTotalSupply ?? '0'))
    // The default config auctions 100% of supply, so nothing is returned (omitted; backend treats empty as 0).
    expect(request?.auction?.returnedSupply).toBeUndefined()
  })

  it('returns the un-auctioned remainder of a new token via returnedSupply', () => {
    const store = buildableStore()
    const { tokenForm, configureAuction, customizePool } = store.getState()
    const base = configureAuction.committed
    expect(base).toBeDefined()
    if (!base) {
      return
    }

    // Auction half of the minted supply; the other half is returned to the creator.
    const currency = base.totalSupply.currency
    const totalRaw = BigInt(base.totalSupply.quotient.toString())
    const auctionedSliceRaw = totalRaw / 2n
    const lpReserveRaw = totalRaw / 4n // any value < the auctioned slice keeps the derived sold amount positive

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction: {
        ...configureAuction,
        committed: {
          ...base,
          auctionSupplyAmount: CurrencyAmount.fromRawAmount(currency, auctionedSliceRaw.toString()),
          postAuctionLiquidityAmount: CurrencyAmount.fromRawAmount(currency, lpReserveRaw.toString()),
        },
      },
      customizePool,
      walletAddress: WALLET_ADDRESS,
      currencyAddress: zeroAddress,
      salt: SALT,
    })

    // The full mint is deposited; the un-auctioned half is returned to the creator.
    expect(request?.auction?.auctionSupply).toBe(totalRaw.toString())
    expect(request?.auction?.returnedSupply).toBe((totalRaw - auctionedSliceRaw).toString())
    expect(request?.pool?.reservedSupplyForLp).toBe(lpReserveRaw.toString())
  })

  it('sends only the deposited slice of an existing token, not its full supply', () => {
    // Deposit 1000 raw (0.000000000000001 UNI) of UNI's 1e27 supply. With the default 100%
    // single LP allocation, R = deposit/2 = 500.
    const request = build(existingTokenStore('1000'))

    expect(request?.tokenInfo?.source?.case).toBe('existing')
    if (request?.tokenInfo?.source?.case === 'existing') {
      expect(request.tokenInfo.source.value.tokenAddress).toBe(UNI_ADDRESS)
      // Existing tokens carry no supply field — the launch amount is auction.auctionSupply.
      expect((request.tokenInfo.source.value as Record<string, unknown>).totalSupply).toBeUndefined()
    }
    // auction.auctionSupply is the deposit (1000), never the token's 1e27 circulating supply.
    expect(request?.auction?.auctionSupply).toBe('1000')
    expect(request?.auction?.auctionSupply).not.toBe(UNI_TOTAL_SUPPLY_RAW)
    expect(request?.pool?.reservedSupplyForLp).toBe('500')
    // Existing tokens deposit only the slice and keep the rest in the wallet — nothing is returned.
    expect(request?.auction?.returnedSupply).toBeUndefined()
  })

  describe('existing-token source validity', () => {
    it('suppresses the request in existing mode when no token is resolved', () => {
      // An unresolved existing token serializes the oneof as `{ existing: {} }` (empty tokenAddress
      // is dropped from JSON), which the backend rejects with
      // "token_info.source must be new_token or existing". The builder must suppress instead of send.
      const store = existingTokenStore('1000')
      store.getState().actions.setTokenForm({
        mode: TokenMode.EXISTING,
        existingTokenCurrencyInfo: undefined,
        description: '',
        xProfile: '',
        websiteLink: '',
        totalSupply: undefined,
      })
      expect(build(store)).toBeUndefined()
    })

    it('emits a non-empty existing oneof when the token is resolved', () => {
      const request = build(existingTokenStore('1000'))
      expect(request?.tokenInfo?.source?.case).toBe('existing')
      if (request?.tokenInfo?.source?.case === 'existing') {
        expect(request.tokenInfo.source.value.tokenAddress).toBe(UNI_ADDRESS)
        expect(request.tokenInfo.source.value.tokenAddress).not.toBe('')
      }
    })
  })

  it('maps a new token into the newToken source with carried metadata defaults', () => {
    const request = build(buildableStore())
    expect(request?.tokenInfo?.source?.case).toBe('newToken')
    if (request?.tokenInfo?.source?.case === 'newToken') {
      expect(request.tokenInfo.source.value.metadata?.xVerificationToken).toBeUndefined()
    }
  })

  it('emits a singlePercent LP allocation by default', () => {
    expect(build(buildableStore())?.pool?.lpAllocation).toEqual({
      kind: { case: 'singlePercent', value: 100 },
    })
  })

  it('emits a tiered LP allocation when the tiered strategy is selected', () => {
    const store = buildableStore()
    store.getState().actions.setPostAuctionLiquidityAllocationType(PostAuctionLiquidityAllocationType.TIERED)
    const kind = build(store)?.pool?.lpAllocation?.kind
    expect(kind?.case).toBe('tiered')
    // narrow the oneof so `value` is the tiered allocation (not the singlePercent number)
    if (kind?.case === 'tiered') {
      expect(Array.isArray(kind.value.tiers)).toBe(true)
    }
  })

  it('serializes tier milestones as decimal strings and the terminal tier as "unbounded"', () => {
    const store = buildableStore()
    const { tokenForm, configureAuction, customizePool } = store.getState()

    const request = buildCreateAuctionRequest({
      tokenForm,
      // The UI stores milestones in compact form and leaves the terminal tier empty; the backend
      // rejects both, requiring decimal strings or the "unbounded" sentinel.
      configureAuction: {
        ...configureAuction,
        postAuctionLiquidityAllocation: {
          type: PostAuctionLiquidityAllocationType.TIERED,
          tiers: [
            { id: 'tier-1', raiseMilestone: '100k', percent: 100 },
            { id: 'tier-2', raiseMilestone: '1m', percent: 100 },
            { id: 'tier-3', raiseMilestone: '', percent: 100 },
          ],
        },
      },
      customizePool,
      walletAddress: WALLET_ADDRESS,
      currencyAddress: zeroAddress,
      salt: SALT,
    })

    const kind = request?.pool?.lpAllocation?.kind
    expect(kind?.case).toBe('tiered')
    if (kind?.case === 'tiered') {
      expect(kind.value.tiers).toEqual([
        { raiseMilestone: '100000', percent: 100 },
        { raiseMilestone: '1000000', percent: 100 },
        { raiseMilestone: 'unbounded', percent: 100 },
      ])
    }
  })

  it('emits no custom ranges for the default (non-custom) price-range strategy', () => {
    expect(build(buildableStore())?.pool?.customRanges).toEqual([])
  })

  it('returns undefined when token amounts are not committed', () => {
    const store = createCreateAuctionStore()
    const { actions } = store.getState()
    actions.setStartTime(new Date('2026-06-15T00:00:00.000Z'))
    actions.setEndTime(new Date('2026-06-18T00:00:00.000Z'))
    actions.setFloorPrice('0.1')
    expect(build(store)).toBeUndefined()
  })

  it('returns undefined when start/end times are missing', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.commitTokenFormAndAdvance()
    store.getState().actions.setFloorPrice('0.1')
    expect(build(store)).toBeUndefined()
  })

  it('returns undefined when the LP reserve exceeds the deposit (negative auction supply)', () => {
    const store = buildableStore()
    const { tokenForm, configureAuction, customizePool } = store.getState()
    expect(configureAuction.committed).toBeDefined()

    const request = buildCreateAuctionRequest({
      tokenForm,
      configureAuction: configureAuction.committed
        ? {
            ...configureAuction,
            committed: {
              ...configureAuction.committed,
              // reserve larger than the deposit -> deposit - reserve is negative
              postAuctionLiquidityAmount: configureAuction.committed.totalSupply.add(
                configureAuction.committed.totalSupply,
              ),
            },
          }
        : configureAuction,
      customizePool,
      walletAddress: WALLET_ADDRESS,
      currencyAddress: zeroAddress,
      salt: SALT,
    })

    expect(request).toBeUndefined()
  })
})

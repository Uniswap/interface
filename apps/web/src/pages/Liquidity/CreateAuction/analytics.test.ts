import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import { describe, expect, it } from 'vitest'
import {
  getAuctionCreateFailedProperties,
  getAuctionCustomPriceRangeAddedProperties,
  getAuctionDetailsInfoEnteredProperties,
  getAuctionFeeTierCreatedProperties,
  getAuctionPoolDetailsInfoEnteredProperties,
  getAuctionTokenInfoEnteredProperties,
  getAuctionVerifyCompletedProperties,
} from '~/pages/Liquidity/CreateAuction/analytics'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { CUSTOM_PRICE_RANGE_POSITIVE_INFINITY, TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { MS_PER_DAY } from '~/pages/Liquidity/CreateAuction/utils/duration'

const trace: ITraceContext = {}

/** Store with token committed and the auction-details fields filled, mirroring useCreateAuctionSubmit.test. */
function committedStore() {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.updateCreateNewTokenField('name', 'Test Token')
  actions.updateCreateNewTokenField('symbol', 'TEST')
  actions.updateCreateNewTokenField('description', 'a token')
  actions.commitTokenFormAndAdvance()
  actions.setStartTime(new Date(Date.now() + MS_PER_DAY))
  actions.setEndTime(new Date(Date.now() + 4 * MS_PER_DAY))
  actions.setFloorPrice('0.1')
  return store
}

describe('getAuctionTokenInfoEnteredProperties', () => {
  it('maps new-token fields and tags the CCA origin', () => {
    const store = committedStore()
    const props = getAuctionTokenInfoEnteredProperties({ trace, tokenForm: store.getState().tokenForm })

    expect(props.token_source).toBe('new')
    expect(props.token_name).toBe('Test Token')
    expect(props.token_ticker).toBe('TEST')
    expect(props.token_description).toBe('a token')
    expect(props.origin).toBe('cca-supply')
  })

  it('omits empty string fields rather than sending blanks', () => {
    const store = createCreateAuctionStore()
    const props = getAuctionTokenInfoEnteredProperties({ trace, tokenForm: store.getState().tokenForm })

    expect(props.token_source).toBe('new')
    expect(props.token_name).toBeUndefined()
    expect(props.token_ticker).toBeUndefined()
  })
})

describe('getAuctionVerifyCompletedProperties', () => {
  it('tags the verify type and CCA origin', () => {
    const props = getAuctionVerifyCompletedProperties({ trace, verifyType: 'twitter' })

    expect(props.verify_type).toBe('twitter')
    expect(props.origin).toBe('cca-supply')
  })
})

describe('getAuctionDetailsInfoEnteredProperties', () => {
  it('snapshots the auction config and derives USD values from the raise price', () => {
    const store = committedStore()
    const props = getAuctionDetailsInfoEnteredProperties({
      trace,
      tokenMode: TokenMode.CREATE_NEW,
      configureAuction: store.getState().configureAuction,
      raiseCurrencyAddress: '0xRaise',
      raiseUsdPrice: 2,
      maxFdv: 1000,
    })

    expect(props.token_source).toBe('new')
    expect(props.floor_price).toBe('0.1')
    expect(props.floor_price_usd).toBeCloseTo(0.2)
    expect(props.raise_currency).toBe('NATIVE')
    expect(props.raise_currency_address).toBe('0xRaise')
    expect(props.max_fdv).toBe(1000)
    expect(props.max_fdv_usd).toBe(2000)
    expect(props.is_bracketed).toBe(false)
    expect(props.bracket_count).toBeUndefined()
    expect(props.has_kyc_hook).toBe(false)
    expect(props.origin).toBe('cca-supply')
  })

  it('omits USD values when the raise oracle is unresolved', () => {
    const store = committedStore()
    const props = getAuctionDetailsInfoEnteredProperties({
      trace,
      tokenMode: TokenMode.CREATE_NEW,
      configureAuction: store.getState().configureAuction,
      raiseUsdPrice: null,
      maxFdv: 1000,
    })

    expect(props.floor_price_usd).toBeUndefined()
    expect(props.max_fdv_usd).toBeUndefined()
  })
})

describe('getAuctionPoolDetailsInfoEnteredProperties', () => {
  it('maps the default pool config and tags the CCA origin', () => {
    const store = createCreateAuctionStore()
    const props = getAuctionPoolDetailsInfoEnteredProperties({
      trace,
      customizePool: store.getState().customizePool,
    })

    expect(props.fee_pct).toBeCloseTo(props.fee_tier / 10000)
    expect(props.range_type).toBe('concentrated_full_range')
    expect(props.custom_range_count).toBeUndefined()
    expect(props.owner_set).toBe(false)
    expect(props.timelock_enabled).toBe(false)
    expect(props.timelock_duration).toBeUndefined()
    expect(props.timelock_unlock_date).toBeUndefined()
    expect(props.fee_forwarding).toBe(false)
    expect(props.buyback_burn).toBe(false)
    expect(props.origin).toBe('cca-supply')
  })

  it('includes the unlock date only when the timelock is enabled', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.setTimeLockEnabled(true)
    const unlock = new Date(Date.now() + 30 * MS_PER_DAY)
    const props = getAuctionPoolDetailsInfoEnteredProperties({
      trace,
      customizePool: store.getState().customizePool,
      timelockUnlockDate: unlock,
    })

    expect(props.timelock_enabled).toBe(true)
    expect(props.timelock_duration).toBeGreaterThan(0)
    expect(props.timelock_unlock_date).toBe(unlock.toISOString())
  })
})

describe('getAuctionCreateFailedProperties', () => {
  it('carries the failed step, chain, source and error code', () => {
    const props = getAuctionCreateFailedProperties({
      trace,
      chainId: UniverseChainId.Unichain,
      tokenMode: TokenMode.EXISTING,
      failedStep: 'create_auction_request',
      errorCode: 500,
    })

    expect(props.failed_step).toBe('create_auction_request')
    expect(props.token_source).toBe('existing')
    expect(props.chain_id).toBe(UniverseChainId.Unichain)
    expect(props.error_code).toBe(500)
  })
})

describe('getAuctionCustomPriceRangeAddedProperties', () => {
  it('maps preset bounds, index and count, and tags the cca-supply origin', () => {
    const props = getAuctionCustomPriceRangeAddedProperties({
      trace,
      preset: { minPercentFromClearing: -50, maxPercentFromClearing: 100 },
      rangeCountBeforeAdd: 2,
    })

    expect(props.range_index).toBe(2)
    expect(props.range_count).toBe(3)
    expect(props.min_price).toBe(-50)
    expect(props.max_price).toBe(100)
    expect(props.origin).toBe('cca-supply')
  })

  it('omits max_price for an unbounded (+∞) range', () => {
    const props = getAuctionCustomPriceRangeAddedProperties({
      trace,
      preset: { minPercentFromClearing: -33, maxPercentFromClearing: CUSTOM_PRICE_RANGE_POSITIVE_INFINITY },
      rangeCountBeforeAdd: 0,
    })

    expect(props.max_price).toBeUndefined()
    expect(props.min_price).toBe(-33)
    expect(props.range_index).toBe(0)
    expect(props.range_count).toBe(1)
  })
})

describe('getAuctionFeeTierCreatedProperties', () => {
  it('converts the fee amount (hundredths of a bip) to a percentage', () => {
    // 3000 hundredths-of-a-bip = 0.3%, matching the fee_pct on Pool Details Info Entered.
    const props = getAuctionFeeTierCreatedProperties({ trace, feeAmount: 3000 })

    expect(props.fee_pct).toBeCloseTo(0.3)
  })
})

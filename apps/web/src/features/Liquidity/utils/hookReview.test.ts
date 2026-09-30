import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { needsHookReview } from '~/features/Liquidity/utils/hookReview'

const HOOK = '0x1111111111111111111111111111111111110080'
const OTHER_HOOK = '0x2222222222222222222222222222222222220080'

describe('needsHookReview', () => {
  it('is true for an unreviewed v4 hook', () => {
    expect(needsHookReview({ hook: HOOK, userApprovedHook: undefined, protocolVersion: ProtocolVersion.V4 })).toBe(true)
  })

  it('is true when a different hook was the one approved', () => {
    expect(needsHookReview({ hook: HOOK, userApprovedHook: OTHER_HOOK, protocolVersion: ProtocolVersion.V4 })).toBe(
      true,
    )
  })

  it('is false once that hook has been approved, whatever the casing of either side', () => {
    expect(
      needsHookReview({ hook: HOOK.toLowerCase(), userApprovedHook: HOOK, protocolVersion: ProtocolVersion.V4 }),
    ).toBe(false)
  })

  it('is false once that hook has been approved', () => {
    expect(needsHookReview({ hook: HOOK, userApprovedHook: HOOK, protocolVersion: ProtocolVersion.V4 })).toBe(false)
  })

  it.each([undefined, ZERO_ADDRESS])('is false when there is no hook (%s)', (hook) => {
    expect(needsHookReview({ hook, userApprovedHook: undefined, protocolVersion: ProtocolVersion.V4 })).toBe(false)
  })

  // Only v4 pools have hooks; a stray `?hook=` on a v3 link is ignored by the calldata and so by the review.
  it.each([ProtocolVersion.V2, ProtocolVersion.V3])('is false on protocol %s', (protocolVersion) => {
    expect(needsHookReview({ hook: HOOK, userApprovedHook: undefined, protocolVersion })).toBe(false)
  })
})

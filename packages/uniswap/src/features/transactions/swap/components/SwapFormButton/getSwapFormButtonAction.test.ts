import { getSwapFormButtonAction } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/getSwapFormButtonAction'
import type { ReviewGateContext } from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import { getReviewGateActionType } from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import { SwapFormButtonAction } from 'uniswap/src/features/transactions/swap/types/swapFormButtonAction'

type Inputs = {
  shouldOpenVerifyIdentityModal: boolean
  needsGeoAcknowledgment: boolean
  promptWebFORNudge: boolean
  isMissingPlatformWallet: boolean
} & ReviewGateContext

const connectedSignerOnReviewableSwap: Inputs = {
  shouldOpenVerifyIdentityModal: false,
  needsGeoAcknowledgment: false,
  promptWebFORNudge: false,
  isMissingPlatformWallet: false,
  swapRedirectCallback: undefined,
  isConnected: true,
  onConnectWallet: vi.fn(),
  isViewOnlyWallet: false,
}

// Runs the same two-step resolution SwapFormButton does, so the review-side cases exercise the real
// prepareSwapService gate instead of a hand-picked gate value.
function resolve(overrides: Partial<Inputs>): SwapFormButtonAction {
  const {
    shouldOpenVerifyIdentityModal,
    needsGeoAcknowledgment,
    promptWebFORNudge,
    isMissingPlatformWallet,
    ...reviewGateContext
  } = { ...connectedSignerOnReviewableSwap, ...overrides }
  return getSwapFormButtonAction({
    shouldOpenVerifyIdentityModal,
    needsGeoAcknowledgment,
    promptWebFORNudge,
    isMissingPlatformWallet,
    reviewGateActionType: getReviewGateActionType(reviewGateContext),
  })
}

describe(getSwapFormButtonAction, () => {
  it('logs the enum values dashboards will query on', () => {
    // Deliberately literal: these strings are the analytics contract, not derived from the enum.
    expect(Object.values(SwapFormButtonAction).sort()).toEqual([
      'add_funds',
      'connect_platform',
      'connect_wallet',
      'geo_acknowledgment',
      'redirect',
      'review',
      'verify_identity',
      'view_only',
    ])
  })

  describe('one case per action', () => {
    it('returns verify_identity when the swap is blocked by a permissioned pool', () => {
      expect(resolve({ shouldOpenVerifyIdentityModal: true })).toBe('verify_identity')
    })

    it('returns geo_acknowledgment when the user must acknowledge a geo restriction', () => {
      expect(resolve({ needsGeoAcknowledgment: true })).toBe('geo_acknowledgment')
    })

    it('returns add_funds when the web FOR nudge will open', () => {
      expect(resolve({ promptWebFORNudge: true })).toBe('add_funds')
    })

    it('returns redirect when a swap redirect callback is set (landing page / embedded swap)', () => {
      expect(resolve({ swapRedirectCallback: vi.fn() })).toBe('redirect')
    })

    it('returns connect_wallet when no wallet is connected', () => {
      expect(resolve({ isConnected: false })).toBe('connect_wallet')
    })

    it('returns connect_platform when connected on the other platform only', () => {
      expect(resolve({ isConnected: false, isMissingPlatformWallet: true })).toBe('connect_platform')
    })

    it('returns view_only when the wallet cannot sign', () => {
      expect(resolve({ isViewOnlyWallet: true })).toBe('view_only')
    })

    it('returns review for a connected signer with nothing intercepting the press', () => {
      expect(resolve({})).toBe('review')
    })
  })

  describe('priority when several conditions hold', () => {
    const everythingTrue: Partial<Inputs> = {
      shouldOpenVerifyIdentityModal: true,
      needsGeoAcknowledgment: true,
      promptWebFORNudge: true,
      swapRedirectCallback: vi.fn(),
      isConnected: false,
      isMissingPlatformWallet: true,
      isViewOnlyWallet: true,
    }

    it('verify_identity beats every other action', () => {
      expect(resolve(everythingTrue)).toBe('verify_identity')
    })

    it('geo_acknowledgment beats add_funds and all review-side actions', () => {
      expect(resolve({ ...everythingTrue, shouldOpenVerifyIdentityModal: false })).toBe('geo_acknowledgment')
    })

    it('add_funds beats redirect, connect and view_only', () => {
      expect(resolve({ ...everythingTrue, shouldOpenVerifyIdentityModal: false, needsGeoAcknowledgment: false })).toBe(
        'add_funds',
      )
    })

    it('redirect beats connect and view_only', () => {
      expect(
        resolve({
          ...everythingTrue,
          shouldOpenVerifyIdentityModal: false,
          needsGeoAcknowledgment: false,
          promptWebFORNudge: false,
        }),
      ).toBe('redirect')
    })

    it('connect beats view_only', () => {
      expect(resolve({ isConnected: false, isViewOnlyWallet: true })).toBe('connect_wallet')
    })
  })

  describe('edge cases', () => {
    it('falls through to view_only when disconnected but the platform has no connect handler', () => {
      expect(resolve({ isConnected: false, onConnectWallet: undefined, isViewOnlyWallet: true })).toBe('view_only')
    })

    it('returns review when disconnected, no connect handler and not view-only', () => {
      expect(resolve({ isConnected: false, onConnectWallet: undefined })).toBe('review')
    })

    it('ignores a missing platform wallet unless the press actually connects', () => {
      expect(resolve({ isMissingPlatformWallet: true })).toBe('review')
    })
  })
})

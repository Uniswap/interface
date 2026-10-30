import { UniverseChainId, type EVMUniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PropsWithChildren } from 'react'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ProtectionResult } from 'uniswap/src/features/dataApi/safety'
import { AttackType, CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { DEFAULT_VERIFIED_AUCTION_IDS } from 'uniswap/src/features/toucan/auctionMetadata'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuctionHeader } from '~/features/Toucan/Auction/AuctionHeader'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

const { WARNING_PROBE, QUICK_LAUNCH_PROBE } = vi.hoisted(() => ({
  WARNING_PROBE: 'auction-header-warning-icon-probe',
  QUICK_LAUNCH_PROBE: 'auction-header-pools-trade-badge-probe',
}))

// The rendered warning is a generated SVG carrying no queryable identity, so only the leaf icon is
// swapped — for a probe that also records the severity handed to it. Everything deciding *whether*
// it mounts stays real: the store, useIsQuickLaunchAuction, and AuctionTokenInfo's own gate.
vi.mock('uniswap/src/components/warnings/WarningIcon', () => ({
  default: ({ severity }: { severity?: WarningSeverity }) => (
    <div data-testid={WARNING_PROBE} data-severity={String(severity)} />
  ),
}))

// Vacuity anchor: proof the fixture really reached the quick-launch path, without which the cases
// below would pass just as well against an auction that never classified as one. This was the
// LiquidityLockedBadge pill until the pill was dropped from the header as duplicative, then the
// Lightning bolt until the bolt became the pools.trade badge — still the quick-launch-only
// rendering in the verified-icon slot. Its gate is `!verified && isQuickLaunch` where isQuickLaunch
// is also Robinhood-chain-gated (pools.trade serves Robinhood launches only), and `verified` is
// auction-level (a VerifiedAuctions config hit on auctionId, which only the verified-slot cases set), so with
// the Robinhood fixture below it still tracks the flag alone. Same leaf-only swap as the warning
// above, and for the same reason.
vi.mock('~/features/Toucan/Shared/PoolsTradeBadge', () => ({
  PoolsTradeBadge: () => <div data-testid={QUICK_LAUNCH_PROBE} />,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

const AUCTION_ADDRESS = '0x9D908e12c463e6ae0f074bF3Af56DedeD0cA1949'
const TOKEN_ADDRESS = '0xE2C24A2394415EA928653f27c74684C95057B13B'

function makeToken(safetyInfo: CurrencyInfo['safetyInfo']): CurrencyInfo {
  return { currency: { isNative: false, name: 'Impostor', symbol: 'IMPO' }, safetyInfo } as CurrencyInfo
}

const IMPERSONATOR_TOKEN = makeToken({
  tokenList: TokenList.NonDefault,
  protectionResult: ProtectionResult.Malicious,
  attackType: AttackType.Impersonator,
})
const CLEAN_TOKEN = makeToken({
  tokenList: TokenList.Default,
  protectionResult: ProtectionResult.Benign,
})
const UNLISTED_TOKEN = makeToken({
  tokenList: TokenList.NonDefault,
  protectionResult: ProtectionResult.Benign,
})

function renderHeader({
  isQuickLaunch,
  token,
  // The badge is Robinhood-only (pools.trade serves Robinhood Chain launches exclusively), so the
  // fixture defaults to Robinhood to keep the quick-launch probe reachable.
  chainId = UniverseChainId.Robinhood,
  auctionId,
}: {
  isQuickLaunch: boolean
  token: CurrencyInfo
  chainId?: EVMUniverseChainId
  auctionId?: string
}): void {
  const store = createAuctionStore(AUCTION_ADDRESS, chainId)
  store.getState().actions.setAuctionDetails({
    address: AUCTION_ADDRESS,
    auctionId,
    chainId,
    tokenAddress: TOKEN_ADDRESS,
    tokenSymbol: 'IMPO',
    isQuickLaunch,
    token,
  } as AuctionDetails)

  function Wrapper({ children }: PropsWithChildren) {
    return <AuctionStoreContext.Provider value={store}>{children}</AuctionStoreContext.Provider>
  }

  render(
    <Wrapper>
      <AuctionHeader />
    </Wrapper>,
  )
}

describe('AuctionHeader token-protection warning', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.QuickLaunch)
  })

  it('warns on a quick-launch auction whose token carries a verdict above Low', () => {
    renderHeader({ isQuickLaunch: true, token: IMPERSONATOR_TOKEN })

    expect(screen.getByTestId(QUICK_LAUNCH_PROBE)).toBeInTheDocument()
    expect(screen.getByTestId(WARNING_PROBE)).toHaveAttribute('data-severity', String(WarningSeverity.High))
  })

  it('warns identically whether or not the auction is a quick launch', () => {
    renderHeader({ isQuickLaunch: false, token: IMPERSONATOR_TOKEN })

    expect(screen.queryByTestId(QUICK_LAUNCH_PROBE)).toBeNull()
    expect(screen.getByTestId(WARNING_PROBE)).toHaveAttribute('data-severity', String(WarningSeverity.High))
  })

  it('stays quiet on a quick-launch auction whose token is clean', () => {
    renderHeader({ isQuickLaunch: true, token: CLEAN_TOKEN })

    expect(screen.getByTestId(QUICK_LAUNCH_PROBE)).toBeInTheDocument()
    expect(screen.queryByTestId(WARNING_PROBE)).toBeNull()
  })

  it('stays quiet on a quick-launch auction whose token is merely unlisted', () => {
    renderHeader({ isQuickLaunch: true, token: UNLISTED_TOKEN })

    expect(screen.getByTestId(QUICK_LAUNCH_PROBE)).toBeInTheDocument()
    expect(screen.queryByTestId(WARNING_PROBE)).toBeNull()
  })

  it('shows no pools.trade badge for a quick launch off Robinhood Chain', () => {
    renderHeader({ isQuickLaunch: true, token: CLEAN_TOKEN, chainId: UniverseChainId.Mainnet })

    expect(screen.queryByTestId(QUICK_LAUNCH_PROBE)).toBeNull()
  })
})

describe('AuctionHeader verified slot', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.QuickLaunch)
  })

  // Tests have no Statsig value, so this exercises the fallback list Explore, search and top auctions
  // also use. A verified auction takes the slot the pools.trade badge would otherwise fill.
  it('treats an auction on the default verified list as verified when Statsig has no value', () => {
    renderHeader({ isQuickLaunch: true, token: CLEAN_TOKEN, auctionId: DEFAULT_VERIFIED_AUCTION_IDS[0] })

    expect(screen.queryByTestId(QUICK_LAUNCH_PROBE)).toBeNull()
  })

  it('leaves an auction missing from the verified list unverified', () => {
    renderHeader({
      isQuickLaunch: true,
      token: CLEAN_TOKEN,
      auctionId: `${UniverseChainId.Robinhood}_${AUCTION_ADDRESS}`,
    })

    expect(screen.getByTestId(QUICK_LAUNCH_PROBE)).toBeInTheDocument()
  })
})

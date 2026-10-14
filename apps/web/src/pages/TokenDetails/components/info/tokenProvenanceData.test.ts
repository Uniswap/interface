import type { PlainMessage } from '@bufbuild/protobuf'
import { type Auction, AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import {
  AuctionDisplayPhase,
  type CurrencyRaisedState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import {
  getTokenProvenanceData,
  getTotalAuctionRaisedUsd,
  type TokenProvenanceAuctionEntry,
} from '~/pages/TokenDetails/components/info/tokenProvenanceData'

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
const CREATOR_ADDRESS = '0x2222222222222222222222222222222222222222'

function makeAuction(overrides: Partial<PlainMessage<Auction>> = {}): PlainMessage<Auction> {
  return {
    address: AUCTION_ADDRESS,
    tokenAddress: '0x3333333333333333333333333333333333333333',
    creatorAddress: CREATOR_ADDRESS,
    createdAt: '2026-08-08T12:00:00Z',
    isQuickLaunch: false,
    startBlock: '100',
    endBlock: '200',
    requiredCurrencyRaised: '1000000000000000000',
    currencyTokenDecimals: 18,
    currencyPriceUsd: '2000',
    xHandle: 'uniswap',
    xVerified: true,
    xProfileImageUrl: 'https://pbs.twimg.com/profile.jpg',
    ...overrides,
  } as PlainMessage<Auction>
}

const ENDED_SUCCESS = {
  chainId: UniverseChainId.Mainnet,
  phase: AuctionDisplayPhase.Ended,
  currencyRaised: { status: 'success', currencyRaised: '5000000000000000000' },
} as const

/** A page showing one auction: the provenance auction is also the only entry resolved for it. */
function provenanceOf({
  auction,
  chainId,
  phase,
  currencyRaised,
}: {
  auction: PlainMessage<Auction>
  chainId: UniverseChainId
  phase: AuctionDisplayPhase
  currencyRaised: CurrencyRaisedState
}): ReturnType<typeof getTokenProvenanceData> {
  return getTokenProvenanceData({ auction, chainId, entries: [{ auction, phase, currencyRaised }] })
}

function ended(
  auction: PlainMessage<Auction>,
  currencyRaised: CurrencyRaisedState = ENDED_SUCCESS.currencyRaised,
): TokenProvenanceAuctionEntry {
  return { auction, phase: AuctionDisplayPhase.Ended, currencyRaised }
}

describe('getTotalAuctionRaisedUsd', () => {
  it('converts different raise currencies to USD before summing', () => {
    expect(
      getTotalAuctionRaisedUsd([
        ended(makeAuction()),
        ended(makeAuction({ currencyTokenDecimals: 6, currencyPriceUsd: '1', requiredCurrencyRaised: '100000000' }), {
          status: 'success',
          currencyRaised: '250000000',
        }),
      ]),
    ).toBe(10250)
  })

  it('includes a confirmed zero without discarding other raises', () => {
    expect(
      getTotalAuctionRaisedUsd([
        ended(makeAuction()),
        ended(makeAuction(), { status: 'success', currencyRaised: '0' }),
      ]),
    ).toBe(10000)
  })

  it('reports nothing when every settled auction raised zero, as the single-auction path does', () => {
    expect(
      getTotalAuctionRaisedUsd([
        ended(makeAuction(), { status: 'success', currencyRaised: '0' }),
        ended(makeAuction(), { status: 'success', currencyRaised: '0' }),
      ]),
    ).toBeUndefined()
  })

  it('leaves out the refunded raise of an auction that did not graduate', () => {
    expect(
      getTotalAuctionRaisedUsd([
        ended(makeAuction()),
        ended(makeAuction({ requiredCurrencyRaised: '9000000000000000000' }), {
          status: 'success',
          currencyRaised: '4000000000000000000',
        }),
      ]),
    ).toBe(10000)
  })

  it('reports nothing when every settled auction failed', () => {
    expect(
      getTotalAuctionRaisedUsd([ended(makeAuction({ requiredCurrencyRaised: '9000000000000000000' }))]),
    ).toBeUndefined()
  })

  it('does not sum an auction that is still live', () => {
    expect(
      getTotalAuctionRaisedUsd([ended(makeAuction()), { ...ended(makeAuction()), phase: AuctionDisplayPhase.Live }]),
    ).toBe(10000)
  })

  it.each([AuctionDisplayPhase.Unknown, AuctionDisplayPhase.Loading])(
    'does not show a partial total while a sibling phase is %s',
    (phase) => {
      expect(getTotalAuctionRaisedUsd([ended(makeAuction()), { ...ended(makeAuction()), phase }])).toBeUndefined()
    },
  )

  it('does not sum an auction that has not started', () => {
    expect(
      getTotalAuctionRaisedUsd([
        ended(makeAuction()),
        { ...ended(makeAuction()), phase: AuctionDisplayPhase.Upcoming },
      ]),
    ).toBe(10000)
  })

  it('does not show a partial total while an ended outcome is unresolved', () => {
    expect(
      getTotalAuctionRaisedUsd([ended(makeAuction()), ended(makeAuction({ requiredCurrencyRaised: undefined }))]),
    ).toBeUndefined()
  })

  it.each([{ status: 'loading' }, { status: 'error' }, { status: 'success', currencyRaised: 'invalid' }] as const)(
    'does not show a partial total for an unavailable raise: %o',
    (currencyRaised) => {
      expect(getTotalAuctionRaisedUsd([ended(makeAuction()), ended(makeAuction(), currencyRaised)])).toBeUndefined()
    },
  )
})

describe('getTokenProvenanceData', () => {
  it('links a valid X handle with its verified mark and avatar', () => {
    const { creator } = provenanceOf({ auction: makeAuction(), ...ENDED_SUCCESS })

    expect(creator).toEqual({
      name: '@uniswap',
      href: 'https://x.com/uniswap',
      verified: true,
      avatarUrl: 'https://pbs.twimg.com/profile.jpg',
    })
  })

  it('falls back to the shortened creator address and explorer link without a handle', () => {
    const { creator } = provenanceOf({
      auction: makeAuction({ xHandle: undefined, xVerified: true, xProfileImageUrl: undefined }),
      ...ENDED_SUCCESS,
    })

    expect(creator.name).toBe('0x2222...2222')
    expect(creator.href).toContain(CREATOR_ADDRESS)
    expect(creator.verified).toBe(false)
    expect(creator.avatarUrl).toBeUndefined()
  })

  it('treats a malformed handle like a missing one', () => {
    const { creator } = provenanceOf({
      auction: makeAuction({ xHandle: 'intent/follow?screen_name=x' }),
      ...ENDED_SUCCESS,
    })

    expect(creator.name).toBe('0x2222...2222')
    expect(creator.verified).toBe(false)
  })

  it('renders a placeholder creator when neither handle nor address exists', () => {
    const { creator } = provenanceOf({
      auction: makeAuction({ xHandle: undefined, creatorAddress: '' }),
      ...ENDED_SUCCESS,
    })

    expect(creator).toEqual({ name: '--', href: undefined, verified: false, avatarUrl: undefined })
  })

  it('prices the ended raise from the checkpoint and links the auction details page', () => {
    const { raised } = provenanceOf({ auction: makeAuction(), ...ENDED_SUCCESS })

    expect(raised?.usd).toBeCloseTo(10_000)
    expect(raised?.destination).toEqual({
      href: `/explore/auctions/ethereum/${AUCTION_ADDRESS}`,
      isExternal: false,
    })
  })

  it('shows no amount for an auction that did not graduate but keeps its Details link', () => {
    const { raised } = provenanceOf({
      auction: makeAuction({ requiredCurrencyRaised: '9000000000000000000' }),
      ...ENDED_SUCCESS,
    })

    expect(raised?.usd).toBeUndefined()
    expect(raised?.destination?.href).toBe(`/explore/auctions/ethereum/${AUCTION_ADDRESS}`)
  })

  it('links the token rather than auction address on pools.xyz for a crowd launch', () => {
    const { raised } = provenanceOf({
      auction: makeAuction({ auctionType: AuctionType.CROWD }),
      ...ENDED_SUCCESS,
      chainId: UniverseChainId.Robinhood,
    })

    expect(raised?.destination).toEqual({
      href: 'https://pools.xyz/t/robinhood/0x3333333333333333333333333333333333333333',
      isExternal: true,
    })
  })

  it('omits a pools.xyz link on an unsupported chain instead of linking to Uniswap', () => {
    const { raised } = provenanceOf({
      auction: makeAuction({ auctionType: AuctionType.CROWD }),
      ...ENDED_SUCCESS,
    })

    expect(raised?.destination).toBeUndefined()
  })

  it('omits the raise row while the auction is live or upcoming', () => {
    for (const phase of [AuctionDisplayPhase.Live, AuctionDisplayPhase.Upcoming, AuctionDisplayPhase.Loading]) {
      expect(provenanceOf({ auction: makeAuction(), ...ENDED_SUCCESS, phase }).raised).toBeUndefined()
    }
  })

  it('keeps the row but leaves the amount unknown while the checkpoint loads or fails', () => {
    for (const currencyRaised of [{ status: 'loading' }, { status: 'error' }, { status: 'idle' }] as const) {
      const { raised } = provenanceOf({ auction: makeAuction(), ...ENDED_SUCCESS, currencyRaised })
      expect(raised?.usd).toBeUndefined()
      expect(raised?.destination?.href).toBeDefined()
    }
  })

  describe('with several auctions on the token', () => {
    const auction = makeAuction({ auctionType: AuctionType.CUSTOM })
    const other = makeAuction({
      address: '0x4444444444444444444444444444444444444444',
      auctionType: AuctionType.CUSTOM,
    })
    const entriesFor = (phases: AuctionDisplayPhase[]): TokenProvenanceAuctionEntry[] =>
      phases.map((phase, index) => ({
        auction: index === 0 ? auction : other,
        phase,
        currencyRaised: ENDED_SUCCESS.currencyRaised,
      }))

    it('sums only the auctions that have ended', () => {
      const { raised } = getTokenProvenanceData({
        auction,
        chainId: UniverseChainId.Mainnet,
        entries: entriesFor([AuctionDisplayPhase.Ended, AuctionDisplayPhase.Live]),
      })

      expect(raised?.usd).toBeCloseTo(10_000)
    })

    it('keeps the history row reachable before any auction has ended', () => {
      const { raised } = getTokenProvenanceData({
        auction,
        chainId: UniverseChainId.Mainnet,
        entries: entriesFor([AuctionDisplayPhase.Live, AuctionDisplayPhase.Live]),
      })

      expect(raised).toEqual({ usd: undefined, destination: undefined })
    })

    it('sends "Details" to the selector rather than to one of the auctions', () => {
      const { raised } = getTokenProvenanceData({
        auction,
        chainId: UniverseChainId.Mainnet,
        entries: entriesFor([AuctionDisplayPhase.Ended, AuctionDisplayPhase.Ended]),
      })

      expect(raised?.usd).toBeCloseTo(20_000)
      expect(raised?.destination).toBeUndefined()
    })

    it('sums an unclassified auction and links the one auction that has a page', () => {
      const { raised } = getTokenProvenanceData({
        auction,
        chainId: UniverseChainId.Mainnet,
        entries: [ended(auction), ended({ ...other, auctionType: AuctionType.UNSPECIFIED })],
      })

      expect(raised?.usd).toBeCloseTo(20_000)
      expect(raised?.destination).toEqual({
        href: `/explore/auctions/ethereum/${AUCTION_ADDRESS}`,
        isExternal: false,
      })
    })

    it('offers no Details when none of the auctions has a page', () => {
      const { raised } = getTokenProvenanceData({
        auction,
        chainId: UniverseChainId.Mainnet,
        entries: [
          ended({ ...auction, auctionType: AuctionType.UNSPECIFIED }),
          ended({ ...other, auctionType: AuctionType.UNSPECIFIED }),
        ],
      })

      expect(raised).toEqual({ usd: 20_000, destination: undefined })
    })
  })

  it('never reports zero or an unpriced raise as an amount', () => {
    expect(
      provenanceOf({
        auction: makeAuction(),
        ...ENDED_SUCCESS,
        currencyRaised: { status: 'success', currencyRaised: '0' },
      }).raised?.usd,
    ).toBeUndefined()
    expect(
      provenanceOf({ auction: makeAuction({ currencyPriceUsd: undefined }), ...ENDED_SUCCESS }).raised?.usd,
    ).toBeUndefined()
    expect(
      provenanceOf({ auction: makeAuction({ currencyTokenDecimals: undefined }), ...ENDED_SUCCESS }).raised?.usd,
    ).toBeUndefined()
  })

  it.each([-1, 1.5, 256, NaN, Infinity])(
    'leaves the raise unknown for invalid currency decimals %s',
    (currencyTokenDecimals) => {
      expect(
        provenanceOf({ auction: makeAuction({ currencyTokenDecimals }), ...ENDED_SUCCESS }).raised?.usd,
      ).toBeUndefined()
    },
  )

  it('prices a legitimate zero-decimal currency', () => {
    expect(
      provenanceOf({
        auction: makeAuction({ currencyTokenDecimals: 0, currencyPriceUsd: '20', requiredCurrencyRaised: '5' }),
        ...ENDED_SUCCESS,
        currencyRaised: { status: 'success', currencyRaised: '5' },
      }).raised?.usd,
    ).toBe(100)
  })

  it.each(['0', '-1', '', 'Infinity', 'NaN'])(
    'leaves the raise unknown for an invalid currency price %s',
    (currencyPriceUsd) => {
      expect(provenanceOf({ auction: makeAuction({ currencyPriceUsd }), ...ENDED_SUCCESS }).raised?.usd).toBeUndefined()
    },
  )

  it.each(['', 'not-a-number', '-1'])('leaves the raise unknown for an invalid raw amount %s', (currencyRaised) => {
    expect(
      provenanceOf({
        auction: makeAuction(),
        ...ENDED_SUCCESS,
        currencyRaised: { status: 'success', currencyRaised },
      }).raised?.usd,
    ).toBeUndefined()
  })

  it.each([
    { currencyPriceUsd: '1e308', rawCurrencyRaised: '5000000000000000000' },
    { currencyPriceUsd: '5e-324', rawCurrencyRaised: '1' },
  ])('keeps an unrepresentable USD amount unknown ($currencyPriceUsd)', ({ currencyPriceUsd, rawCurrencyRaised }) => {
    expect(
      provenanceOf({
        auction: makeAuction({ currencyPriceUsd }),
        ...ENDED_SUCCESS,
        currencyRaised: { status: 'success', currencyRaised: rawCurrencyRaised },
      }).raised?.usd,
    ).toBeUndefined()
  })
})

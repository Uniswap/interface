import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TouchableArea } from '@universe/mycelium'
import { opacifyRaw } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TokenDetailsMoreAuctionsChip,
  TokenDetailsOtherAuctionsRow,
} from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListEntry'
import type { TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('~/hooks/useNavigateToAuctionDetails', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/hooks/useNavigateToAuctionDetails')>()),
  useNavigateToAuctionDetails: () => mockNavigate,
}))
vi.mock('utilities/src/time/useSharedMachineTimeMs', () => ({ useSharedMachineTimeMs: () => Date.now() }))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions', () => ({ useTokenDetailsCcaAuctions: vi.fn() }))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: () => ({
    currentBlock: { status: 'loading' },
    currencyRaised: { status: 'idle' },
    pools: { status: 'loading' },
    refetchCurrentBlock: vi.fn(),
    refetchCheckpoint: vi.fn(),
  }),
}))

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const ONE_HOUR = 60 * 60

function auction({ auctionId, start, end }: { auctionId: string; start: number; end: number }): PlainMessage<Auction> {
  return {
    auctionId,
    address: `0x${auctionId.padStart(40, '0')}`,
    chainId: UniverseChainId.Mainnet,
    tokenSymbol: 'FOO',
    estimatedStartTime: { seconds: BigInt(NOW_SECONDS + start), nanos: 0 },
    estimatedEndTime: { seconds: BigInt(NOW_SECONDS + end), nanos: 0 },
    totalBidVolume: '100',
    totalBidVolumeUsd: '1500',
    requiredCurrencyRaised: '50',
  } as PlainMessage<Auction>
}

const PRIMARY = auction({ auctionId: 'a1', start: -ONE_HOUR, end: 24 * ONE_HOUR })
const OTHER_LIVE = auction({ auctionId: 'a2', start: -ONE_HOUR, end: 2 * ONE_HOUR })
const OTHER_UPCOMING = auction({ auctionId: 'a3', start: ONE_HOUR, end: 2 * ONE_HOUR })
const ENDED = auction({ auctionId: 'a4', start: -3 * ONE_HOUR, end: -ONE_HOUR })

function mockAuctions(auctions: PlainMessage<Auction>[]): void {
  mocked(useTokenDetailsCcaAuctions).mockReturnValue(auctions)
  const state = {
    currencyChainId: UniverseChainId.Mainnet,
    address: '0x3333333333333333333333333333333333333333',
    currency: { symbol: 'FOO' },
    tokenColor: '#7482ff',
    auctionSource: { status: TokenDetailsSourceState.Found, auction: PRIMARY, auctions },
  } as unknown as TDPStoreState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPStoreState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

describe('TokenDetailsAuctionListEntry', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders nothing when the primary auction is the only active one', () => {
    mockAuctions([PRIMARY, ENDED])

    render(
      <>
        <TokenDetailsOtherAuctionsRow />
        <TokenDetailsMoreAuctionsChip />
      </>,
    )

    expect(screen.queryByTestId(TestID.TokenDetailsOtherAuctionsRow)).toBeNull()
    expect(screen.queryByTestId(TestID.TokenDetailsMoreAuctionsChip)).toBeNull()
  })

  it('counts the other live and upcoming auctions and opens the list from the row', () => {
    mockAuctions([PRIMARY, OTHER_LIVE, OTHER_UPCOMING, ENDED])

    render(<TokenDetailsOtherAuctionsRow />)

    const row = screen.getByTestId(TestID.TokenDetailsOtherAuctionsRow)
    expect(row).toHaveTextContent('2 other active auctions')
    expect(screen.queryByTestId(TestID.TokenDetailsAuctionListModal)).toBeNull()

    fireEvent.click(row)

    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)).toHaveLength(4)
  })

  it('uses the token accent for both entries and the taller count chip', () => {
    mockAuctions([PRIMARY, OTHER_LIVE])

    render(
      <>
        <TokenDetailsOtherAuctionsRow />
        <TokenDetailsMoreAuctionsChip />
      </>,
    )

    const row = screen.getByTestId(TestID.TokenDetailsOtherAuctionsRow)
    const chip = screen.getByTestId(TestID.TokenDetailsMoreAuctionsChip)
    for (const entry of [row, chip]) {
      expect(getOwnStyleProp(entry, 'backgroundColor')).toBe(opacifyRaw(8, '#7482ff'))
      expect(getOwnStyleProp(entry, 'borderColor')).toBe(opacifyRaw(8, '#7482ff'))
      expect(getOwnStyleProp(entry, 'borderWidth')).toBe('$spacing1')
    }
    expect(getOwnStyleProp(chip, 'py')).toBe('$spacing6')
    expect(getOwnStyleProp(screen.getByText('+1 more'), 'color')).toBe('#7482ff')
  })

  it.each([
    [TokenDetailsOtherAuctionsRow, TestID.TokenDetailsOtherAuctionsRow],
    [TokenDetailsMoreAuctionsChip, TestID.TokenDetailsMoreAuctionsChip],
  ] as const)('keeps an open list mounted from %s after the last other auction ends', (Entry, testID) => {
    mockAuctions([PRIMARY, OTHER_LIVE])
    const { rerender } = render(<Entry />)
    fireEvent.click(screen.getByTestId(testID))
    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()

    mockAuctions([PRIMARY])
    rerender(<Entry />)

    expect(screen.queryByTestId(testID)).toBeNull()
    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()
  })

  it('opens the list from the chip without pressing through to the surrounding link', () => {
    mockAuctions([PRIMARY, OTHER_UPCOMING])
    const onParentPress = vi.fn()

    render(
      <TouchableArea onPress={onParentPress}>
        <TokenDetailsMoreAuctionsChip />
      </TouchableArea>,
    )

    const chip = screen.getByTestId(TestID.TokenDetailsMoreAuctionsChip)
    expect(chip).toHaveTextContent('+1 more')

    fireEvent.click(chip)
    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)[1]!)
    expect(mockNavigate).toHaveBeenCalledWith({
      auctionAddress: OTHER_UPCOMING.address,
      chainId: UniverseChainId.Mainnet,
    })
    expect(onParentPress).not.toHaveBeenCalled()
  })
})

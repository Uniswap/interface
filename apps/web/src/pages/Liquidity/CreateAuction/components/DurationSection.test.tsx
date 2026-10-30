import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import i18n from 'uniswap/src/i18n'
import { vi } from 'vitest'
import { DurationSection, type DurationSectionHandle } from '~/pages/Liquidity/CreateAuction/components/DurationSection'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES, MS_PER_DAY } from '~/pages/Liquidity/CreateAuction/utils/duration'
import { act, render, screen } from '~/test-utils/render'

const ADD_PRE_BID = i18n.t('toucan.createAuction.step.configureAuction.preBid.add')
const REMOVE_PRE_BID = i18n.t('toucan.createAuction.step.configureAuction.preBid.remove')
const PRE_BID_START = i18n.t('toucan.createAuction.step.configureAuction.preBid.startDate')
const PRE_BID_END = i18n.t('toucan.createAuction.step.configureAuction.preBid.endDate')
const PRE_BID_PERIOD = i18n.t('toucan.createAuction.step.configureAuction.preBid')
const PRE_BID_RANGE_ERROR = i18n.t('toucan.createAuction.step.configureAuction.preBid.range.error')

type Duration = { startTime: Date | undefined; endTime: Date | undefined; preBidStartTime: Date | undefined }

// The calendar opens on the start date's month, so near a month end "a few days after the
// start" lands in the next month and isn't a clickable cell. Pin the clock mid-month; only
// Date is faked, so user-event still runs on real timers.
vi.useFakeTimers({ toFake: ['Date'] })
vi.setSystemTime(new Date(2026, 5, 15, 12))

const START = new Date(Date.now() + MS_PER_DAY)
const END = new Date(Date.now() + 6 * MS_PER_DAY)

/**
 * Renders the section against real state, so the round trip through `onChange` — the thing that
 * actually wires the mirrored boundary together — is under test rather than stubbed out.
 */
function renderSection(initial: Partial<Duration> = {}) {
  const seen: Duration[] = []

  function Harness() {
    const [duration, setDuration] = useState<Duration>({
      startTime: START,
      endTime: END,
      preBidStartTime: undefined,
      ...initial,
    })
    return (
      <DurationSection
        startTime={duration.startTime}
        endTime={duration.endTime}
        preBidStartTime={duration.preBidStartTime}
        onChange={(next) => {
          seen.push(next)
          setDuration(next)
        }}
      />
    )
  }

  // The section reads the token accent colour off the wizard store.
  render(
    <CreateAuctionStoreContext.Provider value={createCreateAuctionStore()}>
      <Harness />
    </CreateAuctionStoreContext.Provider>,
  )
  return { seen }
}

describe('DurationSection pre-bid module', () => {
  // The calendar popover scrolls itself into view on open; jsdom does not implement
  // scrollIntoView, and the resulting unhandled rejection fails the run (exit 1) even though
  // every assertion passes. Assigned unconditionally: the DOM types declare it as always
  // present, so a `??=` reads as an unnecessary nullish assignment to the type-aware lint.
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {}
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('offers the module but does not show it until it is added', () => {
    renderSection()

    expect(screen.getByText(ADD_PRE_BID)).toBeInTheDocument()
    expect(screen.queryByLabelText(PRE_BID_START)).not.toBeInTheDocument()
  })

  it('adds a window that opens before the start date', async () => {
    const { seen } = renderSection()

    await userEvent.click(screen.getByText(ADD_PRE_BID))

    const added = seen.at(-1)!
    expect(added.preBidStartTime).toBeDefined()
    // The invariant the whole module rests on: bidding opens before emission begins.
    expect(added.preBidStartTime!.getTime()).toBeLessThan(added.startTime!.getTime())
    // There is room in front of this start date, so nothing had to move and the end date is
    // left exactly as it was.
    expect(added.endTime).toBe(END)
  })

  it('keeps the configured duration when adding the module has to push the start date out', async () => {
    // Only just past the minimum lead, so the window cannot fit in front of it and seeding
    // moves the emission start.
    const tightStart = new Date(Date.now() + (CREATE_AUCTION_MIN_START_LEAD_TIME_MINUTES + 1) * 60_000)
    const tightEnd = new Date(tightStart.getTime() + 5 * MS_PER_DAY)
    const { seen } = renderSection({ startTime: tightStart, endTime: tightEnd })

    await userEvent.click(screen.getByText(ADD_PRE_BID))

    const added = seen.at(-1)!
    expect(added.startTime!.getTime()).toBeGreaterThan(tightStart.getTime())
    // The end date follows by the same delta, so the auction is still five days long.
    expect(added.endTime!.getTime() - added.startTime!.getTime()).toBe(tightEnd.getTime() - tightStart.getTime())
  })

  it('mirrors the start date into the pre-bid end field', () => {
    const START_LABEL = i18n.t('toucan.createAuction.step.configureAuction.duration.startDate')
    renderSection({ preBidStartTime: new Date(START.getTime() - 15 * 60_000) })

    // "Pre-bid end date" is the Duration start date rendered a second time, so both inputs
    // must be showing the same moment — one boundary, two places to edit it. Each input's
    // textContent leads with its own label, so compare only what follows.
    const shownValue = (label: string): string => screen.getByLabelText(label).textContent.replace(label, '')

    const startDateValue = shownValue(START_LABEL)
    expect(startDateValue).not.toBe('')
    expect(shownValue(PRE_BID_END)).toBe(startDateValue)
  })

  it('removing the module clears the window without disturbing the dates', async () => {
    const { seen } = renderSection({ preBidStartTime: new Date(START.getTime() - 15 * 60_000) })

    await userEvent.click(screen.getByLabelText(REMOVE_PRE_BID))

    expect(seen.at(-1)).toEqual({ startTime: START, endTime: END, preBidStartTime: undefined })
  })

  // The disabled-Continue affordance routes here when the auction's open time is stale. With a
  // window set, that timestamp IS the pre-bid start, and the Duration card's calendar cannot
  // reach it — opening that one instead is a dead end, since no date it offers clears the
  // condition and its own minimum derives from the stale value.
  it('routes preBidStart focus into the pre-bid module, not the Duration card', () => {
    const store = createCreateAuctionStore()
    let handle: DurationSectionHandle | null = null

    function Harness() {
      const ref = useRef<DurationSectionHandle>(null)
      handle = ref.current
      return (
        <DurationSection
          ref={ref}
          startTime={START}
          endTime={END}
          preBidStartTime={new Date(START.getTime() - 15 * 60_000)}
          onChange={() => {}}
        />
      )
    }

    const { rerender } = render(
      <CreateAuctionStoreContext.Provider value={store}>
        <Harness />
      </CreateAuctionStoreContext.Provider>,
    )
    rerender(
      <CreateAuctionStoreContext.Provider value={store}>
        <Harness />
      </CreateAuctionStoreContext.Provider>,
    )

    // The pre-bid module owns the subtree headed by its title; the opened calendar must land inside it.
    const preBidCard = screen.getByText(PRE_BID_PERIOD).closest('div')!.parentElement!
    expect(preBidCard.querySelector('.rdp-month, [class*="rdp"]')).toBeNull()

    act(() => handle!.openCalendar('preBidStart'))

    expect(preBidCard.querySelector('.rdp-month, [class*="rdp"]')).not.toBeNull()
  })

  // Reachable: the range picker clears the far end when a start lands past it
  // (`CreateAuctionDayPicker` emits `rangeEnd: undefined`). Seen from the pre-bid module the far
  // end IS the emission start, so picking a pre-bid start after it would wipe the Duration start
  // date via a date click. Clearing is the Remove button's job.
  it('does not wipe the emission start when a pre-bid start is picked past it', async () => {
    const { seen } = renderSection({ preBidStartTime: new Date(START.getTime() - 15 * 60_000) })

    // Open the pre-bid module's own calendar and pick a day well after the emission start.
    await userEvent.click(screen.getByLabelText(PRE_BID_START))
    const dayAfterStart = new Date(START.getTime() + 3 * MS_PER_DAY)
    const cells = screen.getAllByText(dayAfterStart.getDate().toString())
    await userEvent.click(cells[cells.length - 1])

    // Pins the value, not just its existence: `toBeDefined()` would also pass if a regression
    // moved the emission start to the clicked day instead of clearing it.
    const last = seen.at(-1)
    expect(last).toBeDefined()
    expect(last!.startTime?.getTime()).toBe(START.getTime())
  })

  // The module deliberately supports being added before a start date is picked
  // (`seedPreBidWindow(undefined)`). The ordering error must not shout at an empty field —
  // the step gate and focus routing still treat the state as invalid.
  it('does not show the ordering error before a start date is picked', () => {
    renderSection({ startTime: undefined, preBidStartTime: new Date(Date.now() + 5 * 60_000) })

    expect(screen.queryByText(PRE_BID_RANGE_ERROR)).not.toBeInTheDocument()
  })

  it('shows the ordering error once a start date makes the pair out of order', () => {
    const start = new Date(Date.now() + MS_PER_DAY)
    renderSection({ startTime: start, preBidStartTime: new Date(start.getTime() + 60_000) })

    expect(screen.getByText(PRE_BID_RANGE_ERROR)).toBeInTheDocument()
  })
})

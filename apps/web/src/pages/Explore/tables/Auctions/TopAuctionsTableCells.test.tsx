import { UniverseChainId } from '@universe/chains'
import { useFeatureFlag } from '@universe/gating'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { TokenNameCell } from '~/pages/Explore/tables/Auctions/TopAuctionsTableCells'
import { mocked } from '~/test-utils/mocked'
import { act, fireEvent, render, screen, within } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

const LONG_NAME = 'ABOAR - Allegra Boar, the New Boar of X'

function makeAuction({
  tokenName,
  tokenSymbol = 'ABOAR',
  tokenAddress = '0x1111111111111111111111111111111111111111',
  verified = false,
  isQuickLaunch = false,
}: {
  tokenName?: string
  tokenSymbol?: string | null
  tokenAddress?: string | null
  verified?: boolean
  isQuickLaunch?: boolean
}): EnrichedAuction {
  return {
    verified,
    logoUrl: undefined,
    auction: {
      chainId: UniverseChainId.Robinhood,
      tokenAddress: tokenAddress ?? undefined,
      tokenName,
      tokenSymbol: tokenSymbol ?? undefined,
      isQuickLaunch,
    },
    timeRemaining: {
      isCompleted: false,
      startBlockTimestamp: undefined,
      endBlockTimestamp: undefined,
      preBidEndBlockTimestamp: undefined,
    },
  } as unknown as EnrichedAuction
}

async function hover(element: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.mouseEnter(element)
  })
}

function renderCell(auction: EnrichedAuction): { cell: ReturnType<typeof within>; row: HTMLElement } {
  const { container } = render(<TokenNameCell auction={auction} />)
  return { cell: within(container), row: container.firstElementChild as HTMLElement }
}

/** The tooltip copy is portalled out of the cell, so it is the match that is not inside the row. */
function getTooltipCopy(row: HTMLElement, text: string): HTMLElement {
  const copy = screen.getAllByText(text).find((element) => !row.contains(element))
  if (!copy) {
    throw new Error(`no tooltip copy of "${text}"`)
  }
  return copy
}

describe('TokenNameCell', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(true)
  })

  it('reveals the full token name in a tooltip when the name is hovered', async () => {
    const { cell, row } = renderCell(makeAuction({ tokenName: LONG_NAME }))

    const tooltip = getTooltipCopy(row, LONG_NAME).closest('.invisible, .visible') as HTMLElement
    expect(tooltip.className).toContain('invisible')

    await hover(cell.getByText(LONG_NAME))

    expect(tooltip.className.split(' ')).toContain('visible')
  })

  it('keeps the row link cursor on the name despite the tooltip wrapper forcing cursor: default', () => {
    const { cell } = renderCell(makeAuction({ tokenName: LONG_NAME }))

    const name = cell.getByText(LONG_NAME)
    expect(name.parentElement?.className).toContain('[cursor:default]')
    expect(name.className).toMatch(/cursor-pointer|\[cursor:pointer\]/)
  })

  it('lets the row and the name shrink so a long name ellipsizes instead of overflowing the cell', () => {
    const { cell, row } = renderCell(makeAuction({ tokenName: LONG_NAME }))

    expect(row.className.split(' ')).toContain('shrink')
    expect(row.className.split(' ')).not.toContain('shrink-0')

    const name = cell.getByText(LONG_NAME)
    expect(name.className).toContain('overflow-hidden')
    // The tooltip's inline-block reference is the row's flex item; without min-width 0 its
    // min-content (the full nowrap name) would stop it shrinking.
    const nameItem = Array.from(row.children).find((child) => child.contains(name)) as HTMLElement
    expect(parseFloat(nameItem.style.minWidth)).toBe(0)
  })

  it('keeps the quick-launch badge as a non-shrinking last item of the row', () => {
    const { row } = renderCell(makeAuction({ tokenName: LONG_NAME, isQuickLaunch: true }))

    const badgeItem = row.lastElementChild as HTMLElement
    expect(badgeItem.querySelector('svg')).not.toBeNull()
    expect(badgeItem.className.split(' ')).toContain('shrink-0')
  })

  it('falls back to the symbol when the auction has no token name', () => {
    const { row } = renderCell(makeAuction({ tokenName: undefined, tokenSymbol: 'SYM' }))

    // The name slot (and so its tooltip) carries the symbol.
    expect(getTooltipCopy(row, 'SYM')).toBeInTheDocument()
  })

  it('renders a dash when name, symbol and address are all missing', () => {
    const { cell } = renderCell(makeAuction({ tokenName: undefined, tokenSymbol: null, tokenAddress: null }))

    expect(cell.getByText('—')).toBeInTheDocument()
  })
})

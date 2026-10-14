import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { PositionPageActionButtons } from '~/features/Liquidity/PositionPageActionButtons'
import { TEST_TOKEN_1, TEST_TOKEN_2, toCurrencyAmount } from '~/test-utils/constants'
import { render, screen } from '~/test-utils/render'

const { mockUseMedia } = vi.hoisted(() => ({
  mockUseMedia: vi.fn((): Record<string, boolean> => ({})),
}))

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: () => mockUseMedia(),
  }
})

const positionInfo = {
  chainId: TEST_TOKEN_1.chainId,
  currency0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
  currency1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
  fee0Amount: toCurrencyAmount(TEST_TOKEN_1, 1),
  fee1Amount: toCurrencyAmount(TEST_TOKEN_2, 1),
  status: PositionStatus.IN_RANGE,
  version: ProtocolVersion.V3,
  poolId: '1',
  tokenId: '1',
  v4hook: undefined,
  owner: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
} as unknown as PositionInfo

describe('PositionPageActionButtons', () => {
  afterEach(() => {
    mockUseMedia.mockReturnValue({})
  })

  // Tier 3 (> 768px): full inline action buttons.
  it('renders the full inline buttons above 768px', () => {
    render(<PositionPageActionButtons isOwner positionInfo={positionInfo} onMigrate={() => {}} />)
    expect(screen.getByText('Migrate liquidity')).toBeInTheDocument()
    expect(screen.getByText('Add liquidity')).toBeInTheDocument()
    expect(screen.getByText('Remove liquidity')).toBeInTheDocument()
    expect(screen.getByText('Collect fees')).toBeInTheDocument()
    // No "…" header menu at this width, so its section title is absent.
    expect(screen.queryByText('Liquidity')).not.toBeInTheDocument()
  })

  // Tier 2 (450–768px): the "…" header menu (MobileHeaderActions + WebBottomSheet).
  it('collapses into the "…" header menu between 450 and 768px', () => {
    mockUseMedia.mockReturnValue({ lg: true })
    render(<PositionPageActionButtons isOwner positionInfo={positionInfo} onMigrate={() => {}} />)
    // The sheet renders its section title and every action even while collapsed.
    expect(screen.getByText('Liquidity')).toBeInTheDocument()
    expect(screen.getByText('Migrate liquidity')).toBeInTheDocument()
    expect(screen.getByText('Add liquidity')).toBeInTheDocument()
    expect(screen.getByText('Remove liquidity')).toBeInTheDocument()
    expect(screen.getByText('Collect fees')).toBeInTheDocument()
  })

  // On a V4-unsupported chain the sheet keeps Migrate visible and inert with the reason as a
  // subtitle — matching the inline button's disabled-with-tooltip treatment, which has no
  // hover to trigger on touch.
  it('keeps a disabled Migrate row with the reason on V4-unsupported chains (450–768px)', () => {
    mockUseMedia.mockReturnValue({ lg: true })
    const onMigrate = vi.fn()
    render(
      <PositionPageActionButtons
        isOwner
        positionInfo={{ ...positionInfo, chainId: UniverseChainId.Zksync } as PositionInfo}
        onMigrate={onMigrate}
      />,
    )
    const migrateRow = screen.getByText('Migrate liquidity')
    expect(migrateRow).toBeInTheDocument()
    expect(screen.getByText('This chain does not support v4 liquidity pools.')).toBeInTheDocument()
    migrateRow.click()
    expect(onMigrate).not.toHaveBeenCalled()
  })

  it.each([UniverseChainId.Arc, UniverseChainId.Ink, UniverseChainId.Robinhood])(
    'disables Migrate with a tooltip for V2 positions on chain %s',
    (chainId) => {
      const onMigrate = vi.fn()
      render(
        <PositionPageActionButtons
          isOwner
          positionInfo={{ ...positionInfo, version: ProtocolVersion.V2, chainId } as PositionInfo}
          onMigrate={onMigrate}
        />,
      )
      screen.getByText('Migrate liquidity').click()
      expect(onMigrate).not.toHaveBeenCalled()
    },
  )

  it('keeps a disabled Migrate row with the V2 reason on unsupported chains (450–768px)', () => {
    mockUseMedia.mockReturnValue({ lg: true })
    render(
      <PositionPageActionButtons
        isOwner
        positionInfo={
          { ...positionInfo, version: ProtocolVersion.V2, chainId: UniverseChainId.Robinhood } as PositionInfo
        }
        onMigrate={() => {}}
      />,
    )
    expect(screen.getByText('Migrating to v3 is not supported on this chain.')).toBeInTheDocument()
  })

  // Pins tier 1 to `media.sm` specifically. The ≤450 case below has sm/md/lg all true, so on its own it
  // cannot tell which of the three gates the floating CTA is wired to — rewiring tier 1 to `media.md`
  // leaves it green while moving the CTA up to 640px. This case is one token away from that one: at
  // 451–640 md is still true but sm is false, so a `media.md` gate renders the CTA here and fails.
  it('still uses the "…" menu at 451–640px, where md is true but sm is not', () => {
    mockUseMedia.mockReturnValue({ sm: false, md: true, lg: true })
    render(<PositionPageActionButtons isOwner positionInfo={positionInfo} onMigrate={() => {}} />)
    // The sheet's section title exists only on the "…" branch, never on the floating-CTA branch.
    expect(screen.getByText('Liquidity')).toBeInTheDocument()
    expect(screen.getByText('Remove liquidity')).toBeInTheDocument()
  })

  // Tier 1 (≤ 450px): the floating CTA button + context menu.
  it('shows the floating CTA + context menu at mWeb (≤450px)', () => {
    // Media tokens are maxWidth-based, so ≤450px makes sm/md/lg all true — this is the realistic mock.
    // The 451–640 case above is what discriminates the sm gate from md.
    mockUseMedia.mockReturnValue({ sm: true, md: true, lg: true })
    render(<PositionPageActionButtons isOwner positionInfo={positionInfo} onMigrate={() => {}} />)
    // The primary action stays visible as the floating CTA button; the rest live in the
    // context menu, which is not mounted until the menu trigger opens it.
    expect(screen.getByText('Collect fees')).toBeInTheDocument()
    expect(screen.queryByText('Liquidity')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove liquidity')).not.toBeInTheDocument()
    expect(screen.queryByText('Migrate liquidity')).not.toBeInTheDocument()
    expect(screen.queryByText('Add liquidity')).not.toBeInTheDocument()
  })

  it('renders nothing for non-owners', () => {
    render(<PositionPageActionButtons isOwner={false} positionInfo={positionInfo} onMigrate={() => {}} />)
    expect(screen.queryByText('Add liquidity')).not.toBeInTheDocument()
  })
})

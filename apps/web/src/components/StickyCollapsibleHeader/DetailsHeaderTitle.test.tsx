import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import type { MediaState as MediaQueryState } from '@universe/mycelium/theme-hooks-compat'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DetailsHeaderTitle } from '~/components/StickyCollapsibleHeader/DetailsHeaderTitle'
import { render, screen, waitFor } from '~/test-utils/render'

const mockMedia = vi.fn<() => Partial<MediaQueryState>>()

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return { ...actual, useMedia: () => mockMedia() }
})

const NAME = 'Robinhood Token'
const TITLE_HREF = '/explore/tokens/base/0x208453956fc92c923a44fb8d21dacccafe42d98'
// Stands in for the auction's token-protection warning: an adornment with its own tap target.
const ADORNMENT_LABEL = 'warning'
const CHAIN_ID = UniverseChainId.Base
const NETWORK_BADGE_TEST_ID = `network-logo-${CHAIN_ID}`
// Stands in for the auction's metadata row, whose network entry is what the badge defers to.
const METADATA_ROW = <span>Base</span>

function renderTitle({
  titleHref,
  chainId,
  showLogoNetworkBadgeOnMobileOnly,
  metadataRow,
}: {
  titleHref?: string
  chainId?: UniverseChainId
  showLogoNetworkBadgeOnMobileOnly?: boolean
  metadataRow?: ReactNode
} = {}) {
  return render(
    <DetailsHeaderTitle
      name={NAME}
      symbol="HOOD"
      isCompact={false}
      titleHref={titleHref}
      chainId={chainId}
      showLogoNetworkBadgeOnMobileOnly={showLogoNetworkBadgeOnMobileOnly}
      metadataRow={metadataRow}
      titleAdornments={<button type="button">{ADORNMENT_LABEL}</button>}
    />,
  )
}

function getName(): HTMLElement {
  return screen.getByRole('heading', { level: 1, name: NAME })
}

function getAdornment(): HTMLElement {
  return screen.getByRole('button', { name: ADORNMENT_LABEL })
}

describe('DetailsHeaderTitle', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    mockMedia.mockReturnValue({ sm: false, md: false })
  })

  // The auction page is the only surface passing titleHref, and its adornments are the token-protection
  // warning and the liquidity-lock pill. Inside the anchor, tapping either navigates to the TDP and the
  // warning's tooltip is unreachable on touch.
  describe('with titleHref', () => {
    it('links the name but leaves the adornments outside the anchor', () => {
      renderTitle({ titleHref: TITLE_HREF })

      const anchor = getName().closest('a')
      expect(anchor).not.toBeNull()
      expect(anchor).toHaveAttribute('href', TITLE_HREF)

      expect(getAdornment().closest('a')).toBeNull()
    })

    it('navigates from the name but not from an adornment', async () => {
      renderTitle({ titleHref: TITLE_HREF })

      await userEvent.click(getAdornment())
      expect(window.location.pathname).toBe('/')

      await userEvent.click(getName())
      expect(window.location.pathname).toBe(TITLE_HREF)
    })
  })

  // TDP passes no titleHref, so TitleLink stays a bare fragment: no anchor and no extra wrapper around
  // the name, leaving TDP's title row exactly as it was before the link was introduced.
  describe('without titleHref', () => {
    it('renders no anchor', () => {
      const { container } = renderTitle()

      expect(container.querySelector('a')).toBeNull()
    })

    it('keeps the name, ticker and adornments as direct siblings in the title row', () => {
      renderTitle()

      const titleRow = getName().parentElement
      expect(getAdornment().parentElement).toBe(titleRow)
      expect(Array.from(titleRow?.children ?? []).map((child) => child.tagName)).toEqual(['H1', 'H2', 'BUTTON'])
    })
  })

  // TDP ellipsizes long names on mweb, so a tap on the name has to reveal the full one.
  describe('with titleTooltip', () => {
    it('shows the tooltip on tap and hides it on a tap elsewhere', async () => {
      const user = userEvent.setup()
      render(<DetailsHeaderTitle name={NAME} symbol="HOOD" isCompact={false} titleTooltip={`${NAME} full`} />)

      expect(screen.queryByText(`${NAME} full`)).not.toBeInTheDocument()

      await user.pointer({ keys: '[TouchA]', target: getName() })
      expect(await screen.findByText(`${NAME} full`)).toBeInTheDocument()

      await user.pointer({ keys: '[TouchA]', target: document.body })
      await waitFor(() => expect(screen.queryByText(`${NAME} full`)).not.toBeInTheDocument())
    })
  })

  // TDP names the network in its metadata row at every width and shows the badge alongside it, so the
  // badge stays on by default. The auction row drops its network entry at $sm, so it opts in — and the
  // invariant the opt-in encodes is that the badge is hidden only while the metadata row is there to
  // name the network: at $sm, and in any state that drops the row (the compact header passes none),
  // the badge comes back. The network is never named twice, and never zero times.
  describe('logo network badge', () => {
    it('shows the badge at every width by default', () => {
      const { unmount } = renderTitle({ chainId: CHAIN_ID, metadataRow: METADATA_ROW })
      expect(screen.getByTestId(NETWORK_BADGE_TEST_ID)).toBeInTheDocument()
      unmount()

      mockMedia.mockReturnValue({ sm: true, md: true })
      renderTitle({ chainId: CHAIN_ID, metadataRow: METADATA_ROW })
      expect(screen.getByTestId(NETWORK_BADGE_TEST_ID)).toBeInTheDocument()
    })

    it('hides the badge above $sm when opted in and the metadata row names the network', () => {
      renderTitle({ chainId: CHAIN_ID, showLogoNetworkBadgeOnMobileOnly: true, metadataRow: METADATA_ROW })

      expect(screen.queryByTestId(NETWORK_BADGE_TEST_ID)).toBeNull()
    })

    it('shows the badge at $sm when opted in, where the row drops its network entry', () => {
      mockMedia.mockReturnValue({ sm: true, md: true })

      renderTitle({ chainId: CHAIN_ID, showLogoNetworkBadgeOnMobileOnly: true, metadataRow: METADATA_ROW })

      expect(screen.getByTestId(NETWORK_BADGE_TEST_ID)).toBeInTheDocument()
    })

    // The compact (scrolled) header drops the metadata row at every width, so above $sm the opt-in
    // would otherwise leave the network named nowhere.
    it('shows the badge above $sm when opted in but there is no metadata row', () => {
      renderTitle({ chainId: CHAIN_ID, showLogoNetworkBadgeOnMobileOnly: true })

      expect(screen.getByTestId(NETWORK_BADGE_TEST_ID)).toBeInTheDocument()
    })
  })
})

import { fireEvent } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { NFTCard } from '~/pages/Portfolio/NFTs/NFTCard'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({ evmAddress: undefined, svmAddress: undefined })),
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
}))

const env = vi.hoisted(() => ({ isMobileWeb: false }))
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileWeb() {
      return env.isMobileWeb
    },
  }
})

const OWNER = '0x0000000000000000000000000000000000000001'
const CONTRACT = '0x0000000000000000000000000000000000000002'
const TOKEN_ID = '7'
const SUBTITLE_HEIGHT = 24

const ITEM = {
  name: 'Test NFT',
  collectionName: 'Test Collection',
  contractAddress: CONTRACT,
  tokenId: TOKEN_ID,
  chainId: 1,
} as unknown as NFTItem

/** The compat layer applies transforms via a var-indirection class; the value rides the inline `--c-tr` property. */
function emittedTransform(element: HTMLElement): string | undefined {
  return element.style.getPropertyValue('--c-tr') || undefined
}

function renderCard(): { card: HTMLElement; slider: HTMLElement } {
  render(<NFTCard id={TOKEN_ID} item={ITEM} owner={OWNER} walletAddresses={[OWNER]} />)
  const card = screen.getByTestId(`${TestID.PortfolioNftCardPrefix}${getNFTAssetKey(CONTRACT, TOKEN_ID)}`)
  const slider = screen.getByTestId(TestID.PortfolioNftCardViewOnLink).parentElement as HTMLElement
  return { card, slider }
}

describe('NFTCard subtitle slide', () => {
  beforeEach(() => {
    env.isMobileWeb = false
  })

  it('rests on the collection name and slides to the link on hover', () => {
    const { card, slider } = renderCard()
    const hoverTarget = card.firstElementChild as Element

    expect(screen.getByTestId(TestID.PortfolioNftCardCollectionName)).toBeInTheDocument()
    expect(emittedTransform(slider)).toContain('translateY(0px)')

    fireEvent.mouseEnter(hoverTarget)
    expect(emittedTransform(slider)).toContain(`translateY(-${SUBTITLE_HEIGHT}px)`)

    fireEvent.mouseLeave(hoverTarget)
    expect(emittedTransform(slider)).toContain('translateY(0px)')
  })

  it('stays on the collection name for synthesized mouse events on mobile web', () => {
    env.isMobileWeb = true
    const { card, slider } = renderCard()
    const hoverTarget = card.firstElementChild as Element

    expect(emittedTransform(slider)).toContain('translateY(0px)')

    // A tap synthesizes mouseEnter, and the matching mouseLeave may never arrive.
    fireEvent.mouseEnter(hoverTarget)
    expect(emittedTransform(slider)).toContain('translateY(0px)')
  })

  it('renders no CSS group anchor for the subtitle transition to depend on', () => {
    const { card } = renderCard()

    expect(card.className).not.toContain('group/item')
    expect(card.className).not.toContain('t_group_item')
  })
})

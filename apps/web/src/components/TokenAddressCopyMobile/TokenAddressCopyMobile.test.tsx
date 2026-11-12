import { UniverseChainId } from '@universe/chains'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { TokenAddressCopyMobile } from '~/components/TokenAddressCopyMobile/TokenAddressCopyMobile'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: vi.fn(),
  }
})

const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const MULTICHAIN_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: USDC_MAINNET, isNative: false },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', isNative: false },
]

const baseProps = {
  displayAddress: USDC_MAINNET,
  isNative: false,
  chainId: UniverseChainId.Mainnet,
  isMultiChainAsset: false,
  selectedChainId: UniverseChainId.Mainnet as UniverseChainId | undefined,
  multichainEntries: MULTICHAIN_ENTRIES,
}

describe('TokenAddressCopyMobile', () => {
  beforeEach(() => {
    // The component renders nothing above `sm`.
    mockMediaSize('sm')
  })

  it('names the single-address trigger for the copy it performs', () => {
    render(<TokenAddressCopyMobile {...baseProps} />)

    expect(screen.getByLabelText('Copy address')).toBeInTheDocument()
  })

  // "All Networks" multichain: onPress is undefined and MultichainPillDropdown opens the per-network list
  // instead, so naming it "Copy address" tells a screen-reader user the wrong action. Matches the name the
  // About section's equivalent dropdown already uses (`AddressPill` in TokenDescriptionPills).
  it('names the multichain trigger for the list it opens, not for a copy', () => {
    render(<TokenAddressCopyMobile {...baseProps} isMultiChainAsset selectedChainId={undefined} />)

    expect(screen.getByLabelText('Address')).toBeInTheDocument()
    expect(screen.queryByLabelText('Copy address')).toBeNull()
  })

  // A multichain token pinned to one network still has a single canonical address, so it copies.
  it('keeps the copy name when a multichain token has a network selected', () => {
    render(<TokenAddressCopyMobile {...baseProps} isMultiChainAsset />)

    expect(screen.getByLabelText('Copy address')).toBeInTheDocument()
  })

  it('renders nothing for a native token, which has no contract address to copy', () => {
    render(<TokenAddressCopyMobile {...baseProps} isNative />)

    expect(screen.queryByLabelText('Copy address')).toBeNull()
    expect(screen.queryByLabelText('Address')).toBeNull()
  })
})

import { UniverseChainId } from '@universe/chains'
import { useMedia } from '@universe/mycelium'
import { shortenAddress } from 'utilities/src/addresses'
import { HookDetailsHeader } from '~/pages/HookDetails/components/HookDetailsHeader'
import { render, screen } from '~/test-utils/render'

const ADDRESS = '0x0000000000000000000000000000000000002001'

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: vi.fn(),
}))

describe('HookDetailsHeader', () => {
  beforeEach(() => {
    vi.mocked(useMedia).mockReturnValue({ md: false } as ReturnType<typeof useMedia>)
  })

  it('renders the selected network without an address-copy control or preview label', () => {
    render(
      <HookDetailsHeader
        name="Stable Pair Hook"
        address={ADDRESS}
        chainId={UniverseChainId.Base}
        deployments={[{ chainId: UniverseChainId.Base, address: ADDRESS, deployerAddress: null }]}
      />,
    )

    expect(screen.getByText('Stable Pair Hook')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy hook address' })).not.toBeInTheDocument()
    expect(screen.queryByText('Preview · Sample data')).not.toBeInTheDocument()
  })

  it('uses the short address when the name is absent or whitespace', () => {
    render(
      <HookDetailsHeader
        name="   "
        address={ADDRESS}
        chainId={UniverseChainId.Mainnet}
        deployments={[{ chainId: UniverseChainId.Mainnet, address: ADDRESS, deployerAddress: null }]}
      />,
    )

    expect(screen.getByText(shortenAddress({ address: ADDRESS }))).toBeInTheDocument()
  })

  it('keeps compact mobile identity and badges without a network-name row', () => {
    vi.mocked(useMedia).mockReturnValue({ md: true } as ReturnType<typeof useMedia>)
    render(
      <HookDetailsHeader
        compact
        name="A hook with a long name that must remain readable on a narrow screen"
        address={ADDRESS}
        chainId={UniverseChainId.Base}
        deployments={[{ chainId: UniverseChainId.Base, address: ADDRESS, deployerAddress: null }]}
        badges={<span>Verified source</span>}
      />,
    )

    expect(screen.getByText('Base')).toHaveClass('sr-only')
    expect(screen.getByText('Verified source')).toBeInTheDocument()
    expect(screen.getByText('A hook with a long name that must remain readable on a narrow screen')).toBeInTheDocument()
  })
})

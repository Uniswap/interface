import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { HookDetailsCreatePoolCard } from '~/pages/HookDetails/components/HookDetailsCreatePoolCard'
import { render, screen } from '~/test-utils/render'
import { buildPoolSearchParams } from '~/utils/params/poolLinkParams'

vi.mock('~/utils/params/poolLinkParams', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/params/poolLinkParams')>()
  return { ...actual, buildPoolSearchParams: vi.fn(actual.buildPoolSearchParams) }
})

const MAINNET = {
  chainId: UniverseChainId.Mainnet,
  address: '0x0000113dcf4add69999fad8f20f2b63f979bfcc0',
}
const BASE = {
  chainId: UniverseChainId.Base,
  address: '0x000000258c397d8f759f70444d6dbf3622c22ac0',
}

describe('HookDetailsCreatePoolCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    { deployment: MAINNET, chainName: 'ethereum' },
    { deployment: BASE, chainName: 'base' },
  ])('links to the create form for the selected $chainName deployment', ({ deployment, chainName }) => {
    render(<HookDetailsCreatePoolCard deployment={deployment} />)

    const link = screen.getByTestId(TestID.HookDetailsCreatePool)
    const url = new URL(link.getAttribute('href')!, 'https://app.uniswap.org')
    expect(url.pathname).toBe('/positions/add/new')
    expect(url.searchParams.get('chain')).toBe(chainName)
    expect(url.searchParams.get('hook')?.toLowerCase()).toBe(deployment.address)
    expect(url.searchParams.get('protocolVersion')).toBe('v4')
    expect(url.searchParams.get('entryPoint')).toBe(`/explore/hooks/${chainName}/${url.searchParams.get('hook')}`)
    expect(url.searchParams.has('source')).toBe(false)
    expect(url.searchParams.has('userApprovedHook')).toBe(false)
    expect(screen.getByText('Use this hook on your own custom pool.')).toBeInTheDocument()
  })

  it('updates the destination when a multichain hook switches deployments', () => {
    const { rerender } = render(<HookDetailsCreatePoolCard deployment={MAINNET} />)
    rerender(<HookDetailsCreatePoolCard deployment={BASE} />)

    const href = screen.getByTestId(TestID.HookDetailsCreatePool).getAttribute('href')!
    const params = new URL(href, 'https://app.uniswap.org').searchParams
    expect(params.get('chain')).toBe('base')
    expect(params.get('hook')?.toLowerCase()).toBe(BASE.address)
  })

  it('does not require registry metadata to use a valid deployment', () => {
    render(
      <HookDetailsCreatePoolCard deployment={{ ...BASE, address: '0x000000000000000000000000000000000000abcd' }} />,
    )

    expect(screen.getByTestId(TestID.HookDetailsCreatePool)).toHaveAttribute('href', expect.stringContaining('hook='))
  })

  it('builds the checksummed route without pre-approving the hook', () => {
    render(<HookDetailsCreatePoolCard deployment={MAINNET} />)

    expect(screen.getByTestId(TestID.HookDetailsCreatePool)).toHaveAttribute(
      'href',
      '/positions/add/new?chain=ethereum&hook=0x0000113dCf4ADd69999Fad8F20F2b63F979bfcC0&protocolVersion=v4&entryPoint=%2Fexplore%2Fhooks%2Fethereum%2F0x0000113dCf4ADd69999Fad8F20F2b63F979bfcC0',
    )
    expect(screen.queryByText('Pool creation is unavailable for sample hooks.')).not.toBeInTheDocument()
  })

  it.each(['invalid-address', ZERO_ADDRESS])('omits a real action for an invalid or absent hook (%s)', (address) => {
    render(<HookDetailsCreatePoolCard deployment={{ ...MAINNET, address }} />)

    expect(screen.queryByTestId(TestID.HookDetailsCreatePool)).not.toBeInTheDocument()
    expect(buildPoolSearchParams).not.toHaveBeenCalled()
  })
})

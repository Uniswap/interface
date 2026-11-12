import userEvent from '@testing-library/user-event'
import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { useMedia } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useNavigate, useParams, Route, Routes } from 'react-router'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { HookDeploymentAddress } from '~/features/Hooks/types'
import { HookDetailsNetworkSelector } from '~/pages/HookDetails/components/HookDetailsNetworkSelector'
import { render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const { isSupportedChain, media } = vi.hoisted(() => ({
  media: vi.fn(),
  isSupportedChain: vi.fn<(chainId?: number) => chainId is UniverseChainId>(),
}))

vi.mock('uniswap/src/features/chains/hooks/useSupportedChainId', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/hooks/useSupportedChainId')>()),
  useIsSupportedChainIdCallback: () => isSupportedChain,
}))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: media,
}))

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: media,
}))

const DEPLOYMENTS = [
  { chainId: UniverseChainId.Mainnet, address: '0x1111111111111111111111111111111111111111', deployerAddress: null },
  { chainId: UniverseChainId.Base, address: '0x2222222222222222222222222222222222222222', deployerAddress: null },
] as const satisfies readonly HookDeploymentAddress[]

function RoutedSelector(): JSX.Element {
  const navigate = useNavigate()
  const { chainName, hookAddress } = useParams()
  const deployment = DEPLOYMENTS.find(
    (candidate) => getChainInfo(candidate.chainId).urlParam === chainName && candidate.address === hookAddress,
  )

  return (
    <>
      {deployment && (
        <HookDetailsNetworkSelector
          chainId={deployment.chainId}
          address={deployment.address}
          deployments={DEPLOYMENTS}
        />
      )}
      <button onClick={() => void navigate(-1)}>Back</button>
      <button onClick={() => void navigate(1)}>Forward</button>
    </>
  )
}

describe('HookDetailsNetworkSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupportedChain.mockImplementation((chainId): chainId is UniverseChainId => chainId !== undefined)
    vi.mocked(useMedia).mockReturnValue({ sm: false, md: false } as ReturnType<typeof useMedia>)
  })
  it('keeps a single deployment as a display-only network label', () => {
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Base}
        address={DEPLOYMENTS[1].address}
        deployments={[DEPLOYMENTS[1]]}
      />,
    )

    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokensNetworkFilterTrigger)).not.toBeInTheDocument()
  })

  it('keeps a single enabled deployment as a display-only network label', () => {
    isSupportedChain.mockImplementation(
      (chainId): chainId is UniverseChainId => chainId !== undefined && chainId !== UniverseChainId.Base,
    )
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={DEPLOYMENTS}
      />,
    )

    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokensNetworkFilterTrigger)).not.toBeInTheDocument()
  })

  it.each([false, true])('names the network controls and dialog with mobile=%s', async (mobile) => {
    vi.mocked(useMedia).mockReturnValue({ sm: mobile, md: mobile } as ReturnType<typeof useMedia>)
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={DEPLOYMENTS}
      />,
    )
    const trigger = screen.getByTestId(TestID.TokensNetworkFilterTrigger)
    const control = trigger.closest<HTMLElement>('[data-slot="popover-compat-trigger"]')!
    expect(control).toHaveAccessibleName('Ethereum')
    expect(control).toHaveAttribute('tabindex', '0')
    expect(trigger).toHaveAttribute('tabindex', '-1')

    control.focus()
    expect(control).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('dialog', { name: 'Network' })).toBeInTheDocument()
  })

  it.each([false, true])('omits disabled deployments from the selector with mobile=%s', async (mobile) => {
    vi.mocked(useMedia).mockReturnValue({ sm: mobile, md: mobile } as ReturnType<typeof useMedia>)
    isSupportedChain.mockImplementation(
      (chainId): chainId is UniverseChainId => chainId !== undefined && chainId !== UniverseChainId.Base,
    )
    const sibling = {
      ...DEPLOYMENTS[0],
      chainId: UniverseChainId.ArbitrumOne,
      address: '0x3333333333333333333333333333333333333333',
    }
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={[...DEPLOYMENTS, sibling]}
      />,
    )

    await userEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))

    expect(screen.queryByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Mainnet}`)).toBeInTheDocument()
    expect(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.ArbitrumOne}`)).toBeInTheDocument()
  })

  it('navigates to each deployment’s own address and restores the selected scope through history', async () => {
    window.history.replaceState({}, '', `/explore/hooks/ethereum/${DEPLOYMENTS[0].address}`)
    render(
      <Routes>
        <Route path="/explore/hooks/:chainName/:hookAddress" element={<RoutedSelector />} />
      </Routes>,
    )

    const trigger = screen
      .getByTestId(TestID.TokensNetworkFilterTrigger)
      .closest<HTMLElement>('[data-slot="popover-compat-trigger"]')!
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).toBeInTheDocument()
    expect(screen.queryByText('All networks')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

    expect(window.location.pathname).toBe(`/explore/hooks/base/${DEPLOYMENTS[1].address}`)
    expect(screen.getByTestId(TestID.TokensNetworkFilterTrigger)).toHaveTextContent('Base')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => {
      expect(window.location.pathname).toBe(`/explore/hooks/ethereum/${DEPLOYMENTS[0].address}`)
      expect(screen.getByTestId(TestID.TokensNetworkFilterTrigger)).toHaveTextContent('Ethereum')
    })
    await userEvent.click(screen.getByRole('button', { name: 'Forward' }))
    await waitFor(() => {
      expect(window.location.pathname).toBe(`/explore/hooks/base/${DEPLOYMENTS[1].address}`)
      expect(screen.getByTestId(TestID.TokensNetworkFilterTrigger)).toHaveTextContent('Base')
    })
  })

  it('dismisses with Escape and restores keyboard focus', async () => {
    window.history.replaceState({}, '', `/explore/hooks/ethereum/${DEPLOYMENTS[0].address}`)
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={DEPLOYMENTS}
      />,
    )
    const trigger = screen
      .getByTestId(TestID.TokensNetworkFilterTrigger)
      .closest<HTMLElement>('[data-slot="popover-compat-trigger"]')!
    trigger.focus()
    await userEvent.keyboard(' ')
    expect(await screen.findByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
    expect(window.location.pathname).not.toContain('/base/')
  })
  it('keeps the current address when its chain has another deployment', async () => {
    const sibling = { ...DEPLOYMENTS[0], address: '0x3333333333333333333333333333333333333333' }
    window.history.replaceState({}, '', `/explore/hooks/ethereum/${sibling.address}`)
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={sibling.address}
        deployments={[...DEPLOYMENTS, sibling]}
      />,
    )

    await userEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))
    expect(screen.getAllByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Mainnet}`)).toHaveLength(1)
    await userEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Mainnet}`))

    expect(window.location.pathname).toBe(`/explore/hooks/ethereum/${sibling.address}`)
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ hook_address: sibling.address }),
    )
  })

  it('chooses the first deployment when switching to another chain', async () => {
    const sibling = { ...DEPLOYMENTS[1], address: '0x3333333333333333333333333333333333333333' }
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={[...DEPLOYMENTS, sibling]}
      />,
    )

    await userEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))
    expect(screen.getAllByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`)).toHaveLength(1)
    await userEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

    expect(window.location.pathname).toBe(`/explore/hooks/base/${DEPLOYMENTS[1].address}`)
  })

  it('uses the shared mobile sheet, locks scrolling and closes after selecting a network', async () => {
    vi.mocked(useMedia).mockReturnValue({ sm: true, md: true } as ReturnType<typeof useMedia>)
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={DEPLOYMENTS}
      />,
    )
    const trigger = screen
      .getByTestId(TestID.TokensNetworkFilterTrigger)
      .closest<HTMLElement>('[data-slot="popover-compat-trigger"]')!
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: 'Network' })
    expect(dialog).toHaveAttribute('data-state', 'open')
    expect(dialog.querySelector('[data-sheet-handle]')).not.toBeNull()
    expect(document.documentElement.style.overflow).toBe('hidden')

    await userEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

    expect(window.location.pathname).toBe(`/explore/hooks/base/${DEPLOYMENTS[1].address}`)
    await waitFor(() => expect(dialog).toHaveAttribute('data-state', 'closed'))
    expect(document.documentElement.style.overflow).toBe('')
  })
  it('normalizes hook addresses and follows network-selector telemetry casing', async () => {
    const normalized = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const sibling = { ...DEPLOYMENTS[1], address: normalized.replace('abcdef', 'ABCDEF') }
    render(
      <HookDetailsNetworkSelector
        chainId={UniverseChainId.Mainnet}
        address={DEPLOYMENTS[0].address}
        deployments={[DEPLOYMENTS[0], sibling]}
      />,
    )
    await userEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))
    await userEvent.click(screen.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))
    expect(window.location.pathname).toBe(`/explore/hooks/base/${normalized}`)
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ hook_address: normalized, chain: 'BASE', chain_id: UniverseChainId.Base }),
    )
  })
})

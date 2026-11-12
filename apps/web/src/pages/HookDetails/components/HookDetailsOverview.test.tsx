import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { Text, useMedia } from '@universe/mycelium'
import type { ComponentProps } from 'react'
import {
  UniswapHookProvenance,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'
import { shortenAddress } from 'utilities/src/addresses'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import {
  type HookDetail,
  HookAccounting,
  HookIndexingStatus,
  HookRoutingStatus,
  HookSourceVerification,
} from '~/features/Hooks/types'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { HookDetailsOverview } from '~/pages/HookDetails/components/HookDetailsOverview'
import { HookDetailsPoolsTable } from '~/pages/HookDetails/components/HookDetailsPoolsTable'
import { fireEvent, render, screen, waitFor, within } from '~/test-utils/render'

const { sendEvent } = vi.hoisted(() => ({
  sendEvent: vi.fn<(event: string, properties: Record<string, unknown>) => void>(),
}))

vi.unmock('uniswap/src/features/telemetry/Trace')

vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: { PAGE_VIEWED: 'Page Viewed' },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: vi.fn(),
}))
vi.mock('~/hooks/useScrollCompact', () => ({ useScrollCompact: vi.fn() }))
vi.mock('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance')>()),
  useUniswapHookProvenance: vi.fn(),
}))
vi.mock('utilities/src/telemetry/analytics/analytics', async (importOriginal) => {
  const original = await importOriginal<typeof import('utilities/src/telemetry/analytics/analytics')>()
  return { ...original, analytics: { ...original.analytics, sendEvent } }
})
vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: () => ({ convertFiatAmountFormatted: (value: number) => `USD ${value}` }),
}))

vi.mock('~/pages/HookDetails/components/HookDetailsPoolsTable', () => ({
  HookDetailsPoolsTable: vi.fn(({ headingId }: ComponentProps<typeof HookDetailsPoolsTable>) => (
    <Text tag="h2" id={headingId}>
      Pools
    </Text>
  )),
}))

const ADDRESS = '0x000000000000000000000000000000000000abcd'
const URLS: Record<PoolAreaTab, string> = {
  positions: '/positions?featureFlagOverride=hooks_explore_ux&chain=base',
  pools: '/explore/pools/base?featureFlagOverride=hooks_explore_ux',
  hooks: '/explore/hooks/base?featureFlagOverride=hooks_explore_ux',
}
const HOOK: HookDetail = {
  id: 'hook-detail-test',
  name: '  Stable Pair Hook  ',
  description: '  Selected deployment description.  ',
  descriptionGeneratedByAi: true,
  isFixture: true,
  deployments: [{ chainId: UniverseChainId.Base, address: ADDRESS, deployerAddress: null }],
  deployment: {
    chainId: UniverseChainId.Base,
    address: '0x000000000000000000000000000000000000ABcD',
    deployerAddress: null,
    provenance: { builder: { name: 'Uniswap Labs' }, configurer: null },
    fixtureProvenance: { kind: UniswapHookProvenance.Built, partnerName: 'Fixture partner' },
    sourceVerification: HookSourceVerification.Verified,
    routingStatus: HookRoutingStatus.Supported,
    accounting: HookAccounting.Standard,
    indexing: HookIndexingStatus.Complete,
    metrics: {
      tvlUsd: 200,
      volumeAllTimeUsd: 100,
      volumeUsd: { '1d': 1, '7d': 7, '30d': 30 },
      feesAllTimeUsd: 300,
      poolCount: 9,
    },
    isFixture: true,
  },
}

function pageImpressions(): Record<string, unknown>[] {
  return sendEvent.mock.calls
    .filter(
      ([event, properties]) =>
        event === SharedEventName.PAGE_VIEWED && properties.page === InterfacePageName.HookDetailsPage,
    )
    .map(([, properties]) => properties)
}

describe('HookDetailsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMedia).mockReturnValue({ md: false } as ReturnType<typeof useMedia>)
    vi.mocked(useScrollCompact).mockReturnValue(false)
    vi.mocked(useUniswapHookProvenance).mockReturnValue(() => undefined)
  })

  it('renders selected-deployment metrics and pool scope with attribution and the supplied breadcrumbs', async () => {
    render(<HookDetailsOverview hook={HOOK} urls={URLS} referrer={HookDetailsReferrer.Badge} />)

    expect(screen.getByText('USD 200')).toBeInTheDocument()
    expect(screen.getByText('USD 100')).toBeInTheDocument()
    expect(screen.getByText('USD 300')).toBeInTheDocument()
    expect(screen.getByText('Selected deployment description.')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('hook.description.generatedByAi'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pools' })).toHaveAttribute(
      'href',
      '/explore/pools/base?featureFlagOverride=hooks_explore_ux',
    )
    expect(screen.getByRole('link', { name: 'Hooks' })).toHaveAttribute(
      'href',
      '/explore/hooks/base?featureFlagOverride=hooks_explore_ux',
    )
    expect(vi.mocked(HookDetailsPoolsTable).mock.lastCall?.[0]).toMatchObject({
      deployment: { chainId: HOOK.deployment.chainId, address: HOOK.deployment.address },
      isFixture: true,
    })
    expect(screen.getByRole('link', { name: 'Create a pool' })).toHaveAttribute(
      'href',
      '/positions/add/new?chain=base&hook=0x000000000000000000000000000000000000ABcD&protocolVersion=v4&entryPoint=%2Fexplore%2Fhooks%2Fbase%2F0x000000000000000000000000000000000000ABcD',
    )
    await waitFor(() => expect(document.title).toBe('Stable Pair Hook | Uniswap'))
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Selected deployment description.',
    )
  })

  it('shows unknown source verification as not verified', () => {
    render(
      <HookDetailsOverview
        hook={{ ...HOOK, deployment: { ...HOOK.deployment, sourceVerification: HookSourceVerification.Unknown } }}
        urls={URLS}
        referrer={HookDetailsReferrer.List}
      />,
    )

    expect(screen.getByRole('button', { name: 'Source not verified' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Verified source' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Routing allowlisted' })).toBeInTheDocument()
  })

  it('updates permissions from the selected deployment address', () => {
    const { rerender } = render(
      <HookDetailsOverview
        hook={{ ...HOOK, deployment: { ...HOOK.deployment, address: '0x0000000000000000000000000000000000000080' } }}
        urls={URLS}
        referrer={HookDetailsReferrer.List}
      />,
    )
    const permissions = within(screen.getByRole('group', { name: 'Permissions' }))

    expect(permissions.getByRole('button', { name: 'beforeSwap: Active' })).toBeInTheDocument()
    expect(permissions.getByRole('button', { name: 'afterSwap: Inactive' })).toBeInTheDocument()

    rerender(
      <HookDetailsOverview
        hook={{ ...HOOK, deployment: { ...HOOK.deployment, address: '0x0000000000000000000000000000000000000040' } }}
        urls={URLS}
        referrer={HookDetailsReferrer.List}
      />,
    )

    expect(permissions.getByRole('button', { name: 'beforeSwap: Inactive' })).toBeInTheDocument()
    expect(permissions.getByRole('button', { name: 'afterSwap: Active' })).toBeInTheDocument()
  })

  it('updates the pool scope when a different deployment of the same hook is selected', () => {
    const { rerender } = render(<HookDetailsOverview hook={HOOK} urls={URLS} referrer={HookDetailsReferrer.List} />)
    const deployment = {
      ...HOOK.deployment,
      chainId: UniverseChainId.Mainnet,
      address: '0x1111111111111111111111111111111111111111',
    }
    rerender(<HookDetailsOverview hook={{ ...HOOK, deployment }} urls={URLS} referrer={HookDetailsReferrer.List} />)

    expect(vi.mocked(HookDetailsPoolsTable).mock.lastCall?.[0]).toMatchObject({
      deployment: { chainId: UniverseChainId.Mainnet, address: deployment.address },
      isFixture: true,
    })
  })

  it.each([
    [HookRoutingStatus.Supported, true],
    [HookRoutingStatus.Unsupported, false],
    [HookRoutingStatus.Unknown, undefined],
  ] as const)('records one normalized identity impression with %s routing', (routingStatus, allowlisted) => {
    const hook = { ...HOOK, name: ' ', description: ' ', deployment: { ...HOOK.deployment, routingStatus } }
    render(<HookDetailsOverview hook={hook} urls={URLS} referrer={HookDetailsReferrer.External} />)

    expect(pageImpressions()).toHaveLength(1)
    expect(pageImpressions()[0]).toMatchObject({
      hook_address: ADDRESS,
      chain: UniverseChainId.Base,
      has_metadata: false,
      referrer: HookDetailsReferrer.External,
    })
    if (allowlisted === undefined) {
      expect(pageImpressions()[0]).not.toHaveProperty('allowlisted')
    } else {
      expect(pageImpressions()[0]).toHaveProperty('allowlisted', allowlisted)
    }
    expect(screen.getByRole('heading', { name: shortenAddress({ address: ADDRESS }), level: 1 })).toBeInTheDocument()
    expect(screen.getByText('No description available.')).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('hook.description.generatedByAi'))).not.toBeInTheDocument()
  })

  it('keeps successful data and its impression mounted during a retryable background error', () => {
    const retry = vi.fn()
    const { rerender } = render(<HookDetailsOverview hook={HOOK} urls={URLS} referrer={HookDetailsReferrer.List} />)
    rerender(
      <HookDetailsOverview
        hook={HOOK}
        urls={URLS}
        referrer={HookDetailsReferrer.List}
        backgroundError
        onRetry={retry}
      />,
    )

    expect(screen.getByText('USD 200')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('hooks.details.refreshError'))
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.tryAgain.error') }))
    expect(retry).toHaveBeenCalledOnce()
    expect(pageImpressions()).toHaveLength(1)
  })

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ] as const)('does not label fixture-marked data (%s/%s)', (isFixture, deploymentIsFixture) => {
    render(
      <HookDetailsOverview
        hook={{ ...HOOK, isFixture, deployment: { ...HOOK.deployment, isFixture: deploymentIsFixture } }}
        urls={URLS}
        referrer={HookDetailsReferrer.External}
      />,
    )

    expect(vi.mocked(HookDetailsPoolsTable).mock.lastCall?.[0]).toMatchObject({
      isFixture: isFixture || deploymentIsFixture,
    })
    expect(screen.queryByText('Preview · Sample data')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a pool' })).toBeInTheDocument()
  })

  it.each([
    [UniswapHookProvenance.Built, 'This hook has been built by Uniswap and configured by Fixture partner.'],
    [UniswapHookProvenance.Configured, 'This hook has been built by Fixture partner and configured by Uniswap.'],
  ] as const)('maps the explicit fixture partner for %s provenance', async (kind, description) => {
    render(
      <HookDetailsOverview
        hook={{
          ...HOOK,
          deployment: { ...HOOK.deployment, fixtureProvenance: { kind, partnerName: 'Fixture partner' } },
        }}
        urls={URLS}
        referrer={HookDetailsReferrer.External}
      />,
    )

    fireEvent.focus(screen.getByRole('button', { name: 'Built by Uniswap' }))
    expect(await screen.findByText(description)).toBeInTheDocument()
  })

  it('uses the trusted lookup and real partner data for a live deployment', async () => {
    vi.mocked(useUniswapHookProvenance).mockReturnValue(() => UniswapHookProvenance.Configured)
    render(
      <HookDetailsOverview
        hook={{
          ...HOOK,
          isFixture: false,
          deployment: {
            ...HOOK.deployment,
            isFixture: false,
            provenance: { builder: { name: 'Real partner' }, configurer: null },
          },
        }}
        urls={URLS}
        referrer={HookDetailsReferrer.External}
      />,
    )

    fireEvent.focus(screen.getByRole('button', { name: 'Built by Uniswap' }))
    expect(
      await screen.findByText('This hook has been built by Real partner and configured by Uniswap.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Preview · Sample data')).not.toBeInTheDocument()
  })

  it('shows incomplete indexing independently of custom accounting', () => {
    render(
      <HookDetailsOverview
        hook={{
          ...HOOK,
          deployment: { ...HOOK.deployment, accounting: HookAccounting.Custom, indexing: HookIndexingStatus.Partial },
        }}
        urls={URLS}
        referrer={HookDetailsReferrer.External}
      />,
    )

    expect(screen.getByText('USD 200')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getByText('Some metrics are unavailable while this hook is being indexed.')).toBeInTheDocument()
  })
})

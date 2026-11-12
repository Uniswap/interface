import { useQuery } from '@tanstack/react-query'
import type { UniverseChainId } from '@universe/chains'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import type { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { HOOK_DETAILS_REFERRER_QUERY_PARAM } from 'uniswap/src/utils/linking'
import { usePoolAreaNavigation } from '~/features/Explore/poolArea/hooks/usePoolAreaNavigation'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { parseHooksFixtureScenario } from '~/features/Hooks/fixtures'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import { hookDetailQueryOptions } from '~/features/Hooks/queries'
import type { HooksFixtureScenario } from '~/features/Hooks/types'
import { HookDetailsFallback } from '~/pages/HookDetails/components/HookDetailsFallback'
import { HookDetailsOverview } from '~/pages/HookDetails/components/HookDetailsOverview'
import { HookDetailsStatus } from '~/pages/HookDetails/types'
import { getHookDetailReferrer, getHookDetailRouteState } from '~/pages/HookDetails/utils/route'

function HookDetailsContent({
  chainId,
  hookAddress,
  scenario,
  referrer,
  urls,
}: {
  chainId: UniverseChainId
  hookAddress: string
  scenario: HooksFixtureScenario
  referrer: HookDetailsReferrer
  urls: Record<PoolAreaTab, string>
}): JSX.Element {
  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    ...hookDetailQueryOptions({ chainId, hookAddress, scenario }),
    refetchOnWindowFocus: false,
  })
  const handleRetry = (): void => {
    void refetch()
  }

  if (isPending) {
    return <HookDetailsFallback state={HookDetailsStatus.Loading} backUrl={urls.hooks} />
  }

  if (!data) {
    return (
      <HookDetailsFallback
        state={isError ? HookDetailsStatus.Error : HookDetailsStatus.NotFound}
        backUrl={urls.hooks}
        onRetry={handleRetry}
        retrying={isFetching}
        chainId={chainId}
        hookAddress={hookAddress}
      />
    )
  }

  return (
    <HookDetailsOverview
      key={getHookDeploymentKey(data.deployment)}
      hook={data}
      urls={urls}
      referrer={referrer}
      backgroundError={isError}
      isPlaceholderData={isPlaceholderData}
      onRetry={handleRetry}
    />
  )
}

export default function HookDetailsPage(): JSX.Element {
  const { t } = useTranslation()
  const params = useParams<{ chainName: string; hookAddress: string }>()
  const [searchParams] = useSearchParams()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const urls = usePoolAreaNavigation({ omitSearchParams: [HOOK_DETAILS_REFERRER_QUERY_PARAM] })

  const route = getHookDetailRouteState(params, isSupportedChain)

  return (
    <>
      <Helmet>
        <title>{t('hooks.preview.pageTitle')}</title>
      </Helmet>
      {route.status === HookDetailsStatus.Valid ? (
        <HookDetailsContent
          chainId={route.chainId}
          hookAddress={route.hookAddress}
          scenario={parseHooksFixtureScenario(searchParams.get('hooksFixtureScenario'))}
          referrer={getHookDetailReferrer(searchParams)}
          urls={urls}
        />
      ) : (
        <HookDetailsFallback state={route.status} backUrl={urls.hooks} />
      )}
    </>
  )
}

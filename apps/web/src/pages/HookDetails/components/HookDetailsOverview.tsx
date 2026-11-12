import { SharedEventName } from '@uniswap/analytics-events'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { Flex, Text, TouchableArea, useMedia } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import type { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { shortenAddress } from 'utilities/src/addresses'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from '~/components/BreadcrumbNav'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { HookStatusBadges } from '~/features/Hooks/components/HookStatusBadges'
import { getHookProvenance } from '~/features/Hooks/getHookProvenance'
import { type HookDetail, HookAccounting, HookIndexingStatus, HookRoutingStatus } from '~/features/Hooks/types'
import { PoolAreaLayout } from '~/features/Liquidity/PoolAreaLayout'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { HookDetailsHeader } from '~/pages/HookDetails/components/HookDetailsHeader'
import { HookDetailsSections } from '~/pages/HookDetails/components/HookDetailsSections'
import { HookDetailsIndexingNote, HookDetailsStats } from '~/pages/HookDetails/components/HookDetailsStats'

export function HookDetailsOverview({
  hook,
  urls,
  referrer,
  backgroundError = false,
  isPlaceholderData = false,
  onRetry,
}: {
  hook: HookDetail
  urls: Record<PoolAreaTab, string>
  referrer: HookDetailsReferrer
  backgroundError?: boolean
  isPlaceholderData?: boolean
  onRetry?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const isCompact = useScrollCompact({ thresholdCompact: 100, thresholdExpanded: 60 })
  const getProvenance = useUniswapHookProvenance()
  const { deployment } = hook
  const address = normalizeAddress(deployment.address, AddressStringFormat.Lowercase)
  const name = hook.name?.trim() || shortenAddress({ address })
  const description = hook.description.trim()
  const { provenance, builderName, configurerName } = getHookProvenance({
    deployment,
    isFixture: hook.isFixture,
    getTrustedProvenance: getProvenance,
  })
  const isFixture = hook.isFixture || deployment.isFixture

  return (
    <Trace
      logImpression
      eventOnTrigger={SharedEventName.PAGE_VIEWED}
      page={InterfacePageName.HookDetailsPage}
      properties={{
        hook_address: address,
        chain: deployment.chainId,
        has_metadata: Boolean(hook.name?.trim() || description),
        ...(deployment.routingStatus === HookRoutingStatus.Unknown
          ? {}
          : { allowlisted: deployment.routingStatus === HookRoutingStatus.Supported }),
        referrer,
      }}
    >
      <Helmet>
        <title>{t('hooks.details.pageTitle', { hookName: name })}</title>
        <meta name="description" content={description || t('hooks.details.noDescription')} />
      </Helmet>
      <PoolAreaLayout aria-busy={isPlaceholderData} pt="$spacing40" $md={{ pt: '$spacing16', px: '$none' }}>
        <BreadcrumbNavContainer mb={0} maxWidth="100%">
          <BreadcrumbNavLink to={urls.pools}>
            {t('common.pools')} <RotatableChevron direction="right" size="$icon.16" />
          </BreadcrumbNavLink>
          <BreadcrumbNavLink to={urls.hooks}>
            {t('hooks.title')} <RotatableChevron direction="right" size="$icon.16" />
          </BreadcrumbNavLink>
          <CurrentPageBreadcrumb poolName={name} truncate />
        </BreadcrumbNavContainer>
      </PoolAreaLayout>
      <StickyCollapsibleHeader
        aria-busy={isPlaceholderData}
        isCompact={isCompact}
        withBorder={isCompact && !media.xl}
        px="$none"
        $xxl={{ px: '$spacing40' }}
        $xl={{ px: '$spacing20' }}
      >
        <Flex
          row
          alignItems="center"
          gap={56}
          minWidth={0}
          $xl={{ flexDirection: 'column', alignItems: 'stretch', gap: '$spacing24' }}
        >
          <Flex
            flex={1}
            flexBasis={0}
            minWidth={0}
            $xl={{ flexBasis: 'auto', borderBottomWidth: 1, borderColor: '$surface3', pb: '$spacing16' }}
          >
            <HookDetailsHeader
              name={hook.name}
              address={address}
              chainId={deployment.chainId}
              deployments={hook.deployments}
              compact={isCompact}
              badges={
                <HookStatusBadges
                  sourceVerification={deployment.sourceVerification}
                  routingStatus={deployment.routingStatus}
                  provenance={provenance}
                  builderName={builderName}
                  configurerName={configurerName}
                />
              }
            />
          </Flex>
          <Flex flex={1} flexBasis={0} minWidth={0} gap="$spacing12" $xl={{ flexBasis: 'auto' }}>
            <HookDetailsStats
              tvlUsd={deployment.metrics.tvlUsd}
              volumeAllTimeUsd={deployment.metrics.volumeAllTimeUsd}
              volume30dUsd={deployment.metrics.volumeUsd['30d']}
              feesAllTimeUsd={deployment.metrics.feesAllTimeUsd}
              customAccounting={deployment.accounting === HookAccounting.Custom}
              compact={isCompact}
            />
            {deployment.indexing === HookIndexingStatus.Partial && <HookDetailsIndexingNote />}
          </Flex>
        </Flex>
      </StickyCollapsibleHeader>
      <PoolAreaLayout
        aria-busy={isPlaceholderData}
        pt="$spacing36"
        pb="$spacing40"
        gap="$spacing24"
        $md={{ pt: '$spacing8', px: '$none' }}
      >
        {backgroundError && (
          <Flex row alignItems="center" flexWrap="wrap" gap="$spacing12" role="status">
            <Text variant="body3" color="$neutral2">
              {t('hooks.details.refreshError')}
            </Text>
            {onRetry && (
              <TouchableArea tag="button" onPress={onRetry} minHeight={44}>
                <Text variant="buttonLabel3" color="$accent1">
                  {t('common.tryAgain.error')}
                </Text>
              </TouchableArea>
            )}
          </Flex>
        )}
        <HookDetailsSections
          description={hook.description}
          descriptionGeneratedByAi={hook.descriptionGeneratedByAi}
          deployments={hook.deployments}
          deployment={deployment}
          isFixture={isFixture}
        />
      </PoolAreaLayout>
    </Trace>
  )
}

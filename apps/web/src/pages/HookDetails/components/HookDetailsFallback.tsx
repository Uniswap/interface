import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import { Button, Flex, Shine, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { noop } from 'utilities/src/react/noop'
import { PoolAreaLayout } from '~/features/Liquidity/PoolAreaLayout'
import { type HookDetailsFallbackStatus, HookDetailsStatus } from '~/pages/HookDetails/types'

export function HookDetailsFallback({
  state,
  backUrl,
  onRetry,
  retrying = false,
  chainId,
  hookAddress,
}: {
  state: HookDetailsFallbackStatus
  backUrl: string
  onRetry?: () => void
  retrying?: boolean
  chainId?: UniverseChainId
  hookAddress?: string
}): JSX.Element {
  const { t } = useTranslation()
  const states: Record<HookDetailsFallbackStatus, { title: string; description: string; role?: 'alert' | 'status' }> = {
    [HookDetailsStatus.Loading]: {
      title: t('hooks.details.loading'),
      description: t('hooks.details.loading.description'),
      role: 'status',
    },
    [HookDetailsStatus.Error]: {
      title: t('hooks.details.error'),
      description: t('hooks.details.error.description'),
      role: 'alert',
    },
    [HookDetailsStatus.NotFound]: {
      title: t('hooks.preview.notFound'),
      description: t('hooks.details.notFound.description'),
    },
    [HookDetailsStatus.InvalidAddress]: {
      title: t('hooks.details.invalidAddress'),
      description: t('hooks.details.invalidAddress.description'),
    },
    [HookDetailsStatus.UnsupportedChain]: {
      title: t('hooks.details.unsupportedChain'),
      description: t('hooks.details.unsupportedChain.description'),
    },
  }
  const copy = states[state]

  return (
    <Trace
      key={state}
      logImpression={state !== HookDetailsStatus.Loading}
      eventOnTrigger={SharedEventName.PAGE_VIEWED}
      page={InterfacePageName.HookDetailsPage}
      properties={{ status: state, chain: chainId, hook_address: hookAddress }}
    >
      <PoolAreaLayout gap="$spacing24" py="$spacing48" $md={{ px: '$none', py: '$spacing24' }}>
        <Link to={backUrl} style={{ textDecoration: 'none' }}>
          <Text variant="buttonLabel2" color="$neutral2" hoverStyle={{ color: '$neutral1' }}>
            {t('hooks.details.backToHooks')}
          </Text>
        </Link>
        <Flex gap="$spacing12" aria-busy={state === HookDetailsStatus.Loading || retrying} role={copy.role}>
          <Text tag="h1" variant="heading3" m={0}>
            {copy.title}
          </Text>
          <Text variant="body2" color="$neutral2">
            {copy.description}
          </Text>
          {state === HookDetailsStatus.Loading && (
            <Shine>
              <Flex gap="$spacing24" py="$spacing24" aria-hidden>
                <Flex height={48} width="60%" borderRadius="$rounded12" backgroundColor="$surface3" />
                <Flex row gap="$spacing16">
                  {[0, 1, 2].map((key) => (
                    <Flex key={key} flex={1} height={64} borderRadius="$rounded12" backgroundColor="$surface3" />
                  ))}
                </Flex>
              </Flex>
            </Shine>
          )}
          {state === HookDetailsStatus.Error && onRetry && (
            <Button
              variant="default"
              emphasis="secondary"
              size="small"
              fill={false}
              alignSelf="flex-start"
              disabled={retrying}
              onDisabledPress={noop}
              onPress={onRetry}
            >
              {t('common.tryAgain.error')}
            </Button>
          )}
        </Flex>
      </PoolAreaLayout>
    </Trace>
  )
}

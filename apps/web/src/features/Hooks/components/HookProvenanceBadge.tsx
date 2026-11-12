import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookStatusTooltip } from '~/features/Hooks/components/HookStatusTooltip'

export function HookProvenanceBadge({
  provenance,
  builderName,
  configurerName,
  trigger,
  isolateInteraction = false,
}: {
  provenance: UniswapHookProvenance
  builderName?: string
  configurerName?: string
  trigger?: ReactNode
  isolateInteraction?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const builder = builderName?.trim()
  const configurer = configurerName?.trim()
  const descriptions: Record<UniswapHookProvenance, string> = {
    [UniswapHookProvenance.BuiltAndConfigured]: t('hooks.status.provenance.builtAndConfigured'),
    [UniswapHookProvenance.Built]: configurer
      ? t('hooks.status.provenance.builtWithPartner', { partner: configurer })
      : t('hooks.status.provenance.built'),
    [UniswapHookProvenance.Configured]: builder
      ? t('hooks.status.provenance.configuredWithPartner', { partner: builder })
      : t('hooks.status.provenance.configured'),
  }

  return (
    <HookStatusTooltip
      label={t('hook.builtByUniswap')}
      description={descriptions[provenance]}
      isolateInteraction={isolateInteraction}
    >
      {trigger ?? (
        <Flex backgroundColor="$accent2" borderRadius="$rounded4" px="$spacing4" py="$spacing2">
          <Text variant="body4" color="$accent1">
            {t('hook.builtByUniswap')}
          </Text>
        </Flex>
      )}
    </HookStatusTooltip>
  )
}

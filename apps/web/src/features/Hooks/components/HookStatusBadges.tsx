import { Flex } from '@universe/mycelium'
import { FileListCheck } from '@universe/mycelium/icons/FileListCheck'
import { FileListLock } from '@universe/mycelium/icons/FileListLock'
import { OrderRouting } from '@universe/mycelium/icons/OrderRouting'
import { useTranslation } from 'react-i18next'
import type { UniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { HookProvenanceBadge } from '~/features/Hooks/components/HookProvenanceBadge'
import { HookStatusTooltip } from '~/features/Hooks/components/HookStatusTooltip'
import { HookRoutingStatus, HookSourceVerification } from '~/features/Hooks/types'

interface HookStatusBadgesProps {
  sourceVerification: HookSourceVerification
  routingStatus: HookRoutingStatus
  provenance?: UniswapHookProvenance
  builderName?: string
  configurerName?: string
  positiveOnly?: boolean
  isolateInteraction?: boolean
}

export function HookStatusBadges({
  sourceVerification,
  routingStatus,
  provenance,
  builderName,
  configurerName,
  positiveOnly = false,
  isolateInteraction = false,
}: HookStatusBadgesProps): JSX.Element {
  const { t } = useTranslation()
  const isSourceVerified = sourceVerification === HookSourceVerification.Verified
  const sourceCopy = isSourceVerified
    ? {
        label: t('hooks.status.verifiedSource'),
        description: t('hooks.status.verifiedSource.description'),
      }
    : {
        label: t('hooks.status.unverifiedSource'),
        description:
          sourceVerification === HookSourceVerification.Unknown
            ? t('hooks.status.unknownSource.description')
            : t('hooks.status.unverifiedSource.description'),
      }
  const routingCopy: Record<HookRoutingStatus, { label: string; description: string }> = {
    [HookRoutingStatus.Supported]: {
      label: t('hooks.status.routingAllowlisted'),
      description: t('hooks.status.routingAllowlisted.description'),
    },
    [HookRoutingStatus.Unsupported]: {
      label: t('hooks.status.routingNotAllowlisted'),
      description: t('hooks.status.routingNotAllowlisted.description'),
    },
    [HookRoutingStatus.Unknown]: {
      label: t('hooks.status.routingUnknown'),
      description: t('hooks.status.routingUnknown.description'),
    },
  }

  return (
    <Flex row alignItems="center" flexWrap="wrap" gap="$gap4">
      {provenance !== undefined && (
        <HookProvenanceBadge
          provenance={provenance}
          builderName={builderName}
          configurerName={configurerName}
          isolateInteraction={isolateInteraction}
        />
      )}
      {(!positiveOnly || isSourceVerified) && (
        <HookStatusTooltip {...sourceCopy} isolateInteraction={isolateInteraction}>
          {isSourceVerified ? (
            <FileListCheck size={16} color="$neutral2" />
          ) : (
            <FileListLock size={16} color="$neutral3" />
          )}
        </HookStatusTooltip>
      )}
      {(!positiveOnly || routingStatus === HookRoutingStatus.Supported) && (
        <HookStatusTooltip {...routingCopy[routingStatus]} isolateInteraction={isolateInteraction}>
          <OrderRouting size={16} color={routingStatus === HookRoutingStatus.Supported ? '$neutral2' : '$neutral3'} />
        </HookStatusTooltip>
      )}
    </Flex>
  )
}

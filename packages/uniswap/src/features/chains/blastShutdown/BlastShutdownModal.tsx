import { UniverseChainId } from '@universe/chains'
import { isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Button, Flex, ModalCloseIcon, Text } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { BLAST_BRIDGE_URL } from 'uniswap/src/features/chains/blastShutdown/constants'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

type BlastShutdownModalProps = {
  isOpen: boolean
  onClose: () => void
  description: string
  /** Replaces the default full-width "Bridge funds" button. */
  actions?: ReactNode
}

/** Never opens once `disable_blast` is on: Blast is gone from the app, so there's nothing left to warn about. */
export function BlastShutdownModal({ isOpen, onClose, description, actions }: BlastShutdownModalProps): JSX.Element {
  const { t } = useTranslation()
  const { shutdownDate } = useBlastShutdownDates()
  const isBlastDisabled = useFeatureFlag(FeatureFlags.DisableBlast)

  const onBridgeFunds = (): void => {
    openUri({ uri: BLAST_BRIDGE_URL }).catch(() => undefined)
    onClose()
  }

  return (
    <Modal
      isModalOpen={isOpen && !isBlastDisabled}
      name={ModalName.BlastShutdown}
      maxWidth={isWebPlatform ? 420 : undefined}
      pt={isWebPlatform ? '$spacing16' : undefined}
      onClose={onClose}
    >
      {isWebPlatform && (
        <Flex row justifyContent="flex-end" alignItems="center" height="$spacing36">
          <ModalCloseIcon onClose={onClose} />
        </Flex>
      )}
      <Flex
        gap="$spacing24"
        pt={isWebPlatform ? '$spacing8' : '$spacing16'}
        px={isWebPlatform ? undefined : '$spacing24'}
        pb={isWebPlatform ? undefined : '$spacing24'}
      >
        <Flex alignItems="center" gap="$spacing16">
          <NetworkLogo chainId={UniverseChainId.Blast} size={48} shape="square" borderRadius={12} />
          <Flex alignItems="center" gap="$spacing8">
            <Text variant="subheading1" textAlign="center">
              {t('chains.blast.shutdown.title', { date: shutdownDate })}
            </Text>
            <Text variant="body2" color="$statusCritical" textAlign="center">
              {t('chains.blast.shutdown.warning')}
            </Text>
            <Text variant="body2" color="$neutral2" textAlign="center">
              {description}
            </Text>
          </Flex>
        </Flex>
        {actions ?? (
          <Flex row>
            <Button
              size="medium"
              emphasis="primary"
              icon={<ExternalLink size="$icon.20" />}
              iconPosition="after"
              onPress={onBridgeFunds}
            >
              {t('chains.blast.shutdown.bridgeFunds')}
            </Button>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}

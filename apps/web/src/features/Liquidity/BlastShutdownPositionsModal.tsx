import { UniverseChainId } from '@universe/chains'
import { Button, Flex } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { BlastShutdownModal } from 'uniswap/src/features/chains/blastShutdown/BlastShutdownModal'
import { BLAST_BRIDGE_URL } from 'uniswap/src/features/chains/blastShutdown/constants'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import { openUri } from 'uniswap/src/utils/linking'
import { getChainUrlParam } from '~/utils/params/chainParams'

/** Blast shutdown modal for a wallet with Blast LP positions: [Bridge ↗] [View positions]. Both actions close it. */
export function BlastShutdownPositionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bridgeDeadline } = useBlastShutdownDates()

  const onBridge = (): void => {
    openUri({ uri: BLAST_BRIDGE_URL }).catch(() => undefined)
    onClose()
  }

  const onViewPositions = (): void => {
    navigate(`/positions?chain=${getChainUrlParam(UniverseChainId.Blast)}`)
    onClose()
  }

  return (
    <BlastShutdownModal
      isOpen={isOpen}
      description={t('chains.blast.shutdown.closePositionsAndBridge', { date: bridgeDeadline })}
      actions={
        <Flex row gap="$spacing8">
          <Button
            size="medium"
            emphasis="secondary"
            icon={<ExternalLink size="$icon.20" />}
            iconPosition="after"
            onPress={onBridge}
          >
            {t('chains.blast.shutdown.bridge')}
          </Button>
          <Button size="medium" emphasis="primary" onPress={onViewPositions}>
            {t('chains.blast.shutdown.viewPositions')}
          </Button>
        </Flex>
      }
      onClose={onClose}
    />
  )
}

import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlastExposure } from 'uniswap/src/features/chains/blastShutdown/useBlastExposure'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import { BlastShutdownPositionsModal } from '~/features/Liquidity/BlastShutdownPositionsModal'

/**
 * Non-blocking Blast shutdown warning for the LP surfaces (create flows, /positions, position detail). Hidden once
 * `disable_blast` is on, same as BlastShutdownModal.
 */
export function BlastShutdownBanner({ onPress }: { onPress?: () => void }): JSX.Element | null {
  const { t } = useTranslation()
  const { shutdownDate } = useBlastShutdownDates()
  const isBlastDisabled = useFeatureFlag(FeatureFlags.DisableBlast)

  if (isBlastDisabled) {
    return null
  }

  const banner = (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      p="$spacing16"
      borderRadius="$rounded16"
      backgroundColor="$statusWarning2"
    >
      <AlertTriangleFilled color="$statusWarning" size="$icon.24" flexShrink={0} />
      <Text variant="body2" color="$neutral1">
        {t('chains.blast.shutdown.lpWarning', { date: shutdownDate })}
      </Text>
    </Flex>
  )

  return onPress ? <TouchableArea onPress={onPress}>{banner}</TouchableArea> : banner
}

/** On /positions for a wallet with open Blast positions; clicking reopens the connect modal's positions variant. */
export function BlastShutdownPositionsBanner(): JSX.Element | null {
  const { hasPositions } = useBlastExposure()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!hasPositions) {
    return null
  }

  return (
    <>
      <BlastShutdownBanner onPress={() => setIsModalOpen(true)} />
      <BlastShutdownPositionsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

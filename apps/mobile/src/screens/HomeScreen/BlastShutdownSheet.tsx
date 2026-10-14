import { useIsFocused } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { BlastShutdownModal } from 'uniswap/src/features/chains/blastShutdown/BlastShutdownModal'
import { useBlastExposure } from 'uniswap/src/features/chains/blastShutdown/useBlastExposure'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import {
  dismissBlastShutdown,
  useBlastShutdownDismissals,
} from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDismissals'

const DISMISSAL_KEY = 'homeSheet'

/** Shown on Home once per app launch; the modal portals to the root, so it waits for Home to have focus. */
export function BlastShutdownSheet(): JSX.Element {
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const { hasBalance } = useBlastExposure()
  const { bridgeDeadline } = useBlastShutdownDates()
  const isDismissed = useBlastShutdownDismissals((s) => s.dismissed.has(DISMISSAL_KEY))

  const dismiss = (): void => dismissBlastShutdown(DISMISSAL_KEY)

  return (
    <BlastShutdownModal
      isOpen={hasBalance && isFocused && !isDismissed}
      description={t('chains.blast.shutdown.bridgeTokens', { date: bridgeDeadline })}
      onClose={dismiss}
    />
  )
}

import { useTranslation } from 'react-i18next'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { BlastShutdownModal } from 'uniswap/src/features/chains/blastShutdown/BlastShutdownModal'
import { useBlastExposure } from 'uniswap/src/features/chains/blastShutdown/useBlastExposure'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import {
  dismissBlastShutdown,
  useBlastShutdownDismissals,
} from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDismissals'
import { BlastShutdownPositionsModal } from '~/features/Liquidity/BlastShutdownPositionsModal'

/** Shown once a connected wallet's Blast exposure loads; a dismissal holds for that address for the session. */
export function BlastShutdownConnectModal(): JSX.Element {
  const { t } = useTranslation()
  const { evmAddress } = useActiveAddresses()
  const { hasBalance, hasPositions, positionsUnknown, isLoading } = useBlastExposure()
  const { bridgeDeadline } = useBlastShutdownDates()
  const dismissalKey = `connect:${evmAddress}`
  const isDismissed = useBlastShutdownDismissals((s) => s.dismissed.has(dismissalKey))

  const dismiss = (): void => dismissBlastShutdown(dismissalKey)
  const isOpen = !isLoading && (hasBalance || hasPositions) && !isDismissed

  // Positions win over balance: an LP has to withdraw before they can bridge. If positions failed to load, a balance
  // holder may still have some, so they get the positions copy too.
  if (hasPositions || (hasBalance && positionsUnknown)) {
    return <BlastShutdownPositionsModal isOpen={isOpen} onClose={dismiss} />
  }

  return (
    <BlastShutdownModal
      isOpen={isOpen}
      description={t('chains.blast.shutdown.bridgeTokens', { date: bridgeDeadline })}
      onClose={dismiss}
    />
  )
}

import { UniverseChainId } from '@universe/chains'
import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { BlastShutdownModal } from 'uniswap/src/features/chains/blastShutdown/BlastShutdownModal'
import { useBlastShutdownDates } from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDates'
import {
  dismissBlastShutdown,
  useBlastShutdownDismissals,
} from 'uniswap/src/features/chains/blastShutdown/useBlastShutdownDismissals'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/** Opens while any of `currencies` is on Blast; a dismissal holds for that Blast selection for the session. */
export function BlastShutdownSelectionModal({
  currencies,
}: {
  currencies: ReadonlyArray<Maybe<CurrencyInfo>>
}): JSX.Element {
  const { t } = useTranslation()
  const { bridgeDeadline } = useBlastShutdownDates()

  // Sorted so flipping a swap pair doesn't reopen a dismissed modal.
  const blastSelection = currencies
    .flatMap((info) => (info?.currency.chainId === UniverseChainId.Blast ? [info.currencyId] : []))
    .sort((a, b) => a.localeCompare(b))
    .join()
  const dismissalKey = `selection:${blastSelection}`
  const isDismissed = useBlastShutdownDismissals((s) => s.dismissed.has(dismissalKey))

  const dismiss = (): void => dismissBlastShutdown(dismissalKey)

  return (
    <BlastShutdownModal
      isOpen={blastSelection !== '' && !isDismissed}
      description={
        isWebPlatform
          ? t('chains.blast.shutdown.closePositionsAndBridge', { date: bridgeDeadline })
          : t('chains.blast.shutdown.bridgeTokens', { date: bridgeDeadline })
      }
      onClose={dismiss}
    />
  )
}

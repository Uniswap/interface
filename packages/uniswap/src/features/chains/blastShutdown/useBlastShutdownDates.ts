import { useMemo } from 'react'
import { BLAST_BRIDGE_DEADLINE, BLAST_SHUTDOWN_DATE } from 'uniswap/src/features/chains/blastShutdown/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

/** Month + day ("October 28") in the app locale. UTC so the date can't shift a day in western timezones. */
export function useBlastShutdownDates(): { shutdownDate: string; bridgeDeadline: string } {
  const locale = useCurrentLocale()

  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', timeZone: 'UTC' })
    return {
      shutdownDate: formatter.format(BLAST_SHUTDOWN_DATE),
      bridgeDeadline: formatter.format(BLAST_BRIDGE_DEADLINE),
    }
  }, [locale])
}

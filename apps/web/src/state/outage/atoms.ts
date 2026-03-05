import { atomWithReset } from 'jotai/utils'
import { ChainOutageData } from 'state/outage/types'

/**
 * Global atom for the currently displayed outage banner.
 * Updated by useUpdateManualOutage hook based on error detection.
 * Read by OutageBanners component to determine if/what to display.
 */
export const manualChainOutageAtom = atomWithReset<ChainOutageData | undefined>(undefined)

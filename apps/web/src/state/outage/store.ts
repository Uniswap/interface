import { ChainOutageData } from '~/state/outage/types'
import { createResettableStore } from '~/utils/createResettableStore'

/**
 * Global store for the currently displayed outage banner.
 * Updated by useUpdateManualOutage hook based on error detection.
 * Read by OutageBanners component to determine if/what to display.
 */
export const useManualChainOutageStore = createResettableStore<ChainOutageData | undefined>(undefined)

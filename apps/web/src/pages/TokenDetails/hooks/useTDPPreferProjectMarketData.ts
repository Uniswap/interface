import { usePreferProjectMarketData } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { useTDPRWACandidates } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

export function useTDPPreferProjectMarketData(): boolean {
  const candidates = useTDPRWACandidates()

  return usePreferProjectMarketData(candidates)
}

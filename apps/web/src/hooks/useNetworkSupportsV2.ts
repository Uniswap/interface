import { useWeb3React } from '@web3-react/core'
import { SUPPORTED_V2POOL_CHAIN_IDS, SUPPORTED_V2POOL_CHAIN_IDS_DEPRECATED } from 'constants/chains'
import { useV2EverywhereEnabled } from 'featureFlags/flags/v2Everywhere'

export function useNetworkSupportsV2() {
  const { chainId } = useWeb3React()
  const isV2EverywhereEnabled = useV2EverywhereEnabled()

  return (
    chainId &&
    ((isV2EverywhereEnabled && SUPPORTED_V2POOL_CHAIN_IDS.includes(chainId)) ||
      SUPPORTED_V2POOL_CHAIN_IDS_DEPRECATED.includes(chainId))
  )
}

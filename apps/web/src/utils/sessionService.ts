import { getIsSessionServiceEnabled, useIsSessionServiceEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { isAppRigoblockCom, isAppRigoblockStagingCom } from '~/utils/env'

function isRigoblockHostname(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return isAppRigoblockCom(window.location) || isAppRigoblockStagingCom(window.location)
}

export function getIsSessionServiceEnabledOnWeb(): boolean {
  // RigoBlock deployment does not rely on Uniswap SessionService challenge/cookies.
  if (isRigoblockHostname()) {
    return false
  }

  return getIsSessionServiceEnabled()
}

export function useIsSessionServiceEnabledOnWeb(): boolean {
  const featureEnabled = useIsSessionServiceEnabled()

  return useMemo(() => {
    if (isRigoblockHostname()) {
      return false
    }

    return featureEnabled
  }, [featureEnabled])
}
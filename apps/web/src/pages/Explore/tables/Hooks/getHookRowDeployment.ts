import { areEvmAddressesEqual, type UniverseChainId } from '@universe/chains'
import { getHookSearchAddress } from '~/features/Hooks/hookSearch'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import type { Hook, HookDeployment } from '~/features/Hooks/types'

export function getHookRowDeployment({
  hook,
  chainId,
  search,
}: {
  hook: Hook
  chainId?: UniverseChainId
  search?: string
}): HookDeployment | undefined {
  if (chainId !== undefined) {
    return hook.deployments.find((deployment) => deployment.chainId === chainId)
  }

  const searchAddress = getHookSearchAddress(search)
  const deployments = searchAddress
    ? hook.deployments.filter((deployment) => areEvmAddressesEqual(deployment.address, searchAddress))
    : hook.deployments
  const first = deployments.at(0)
  if (!first) {
    return undefined
  }

  return deployments.slice(1).reduce((selected, candidate) => {
    const selectedTvl = selected.metrics.tvlUsd ?? -Infinity
    const candidateTvl = candidate.metrics.tvlUsd ?? -Infinity

    if (
      candidateTvl > selectedTvl ||
      (candidateTvl === selectedTvl && getHookDeploymentKey(candidate) < getHookDeploymentKey(selected))
    ) {
      return candidate
    }

    return selected
  }, first)
}

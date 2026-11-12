import { AddressStringFormat, normalizeAddress, type UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text, useMedia } from '@universe/mycelium'
import { useNavigate } from 'react-router'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getHookDetailsURL } from 'uniswap/src/utils/linking'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { getHookDeploymentKey } from '~/features/Hooks/identity'
import type { HookDeploymentAddress } from '~/features/Hooks/types'

export function HookDetailsNetworkSelector({
  chainId,
  address,
  deployments,
}: {
  chainId: UniverseChainId
  address: string
  deployments: readonly HookDeploymentAddress[]
}): JSX.Element {
  const media = useMedia()
  const navigate = useNavigate()
  const activeAddresses = useActiveAddresses()
  const isSupportedChain = useIsSupportedChainIdCallback()
  const supportedDeployments = deployments.filter((deployment) => isSupportedChain(deployment.chainId))
  const chainIds = [...new Set(supportedDeployments.map((deployment) => deployment.chainId))]
  const tieredOptions = useNetworkSelectorOptions({ addresses: activeAddresses, chainIds })
  const selectedKey = getHookDeploymentKey({ chainId, address })

  function getDeployment(nextChainId: UniverseChainId | null): HookDeploymentAddress | undefined {
    return (
      supportedDeployments.find(
        (candidate) => candidate.chainId === nextChainId && getHookDeploymentKey(candidate) === selectedKey,
      ) ?? supportedDeployments.find((candidate) => candidate.chainId === nextChainId)
    )
  }

  function selectChain(nextChainId: UniverseChainId | null): void {
    const deployment = getDeployment(nextChainId)
    if (!deployment) {
      return
    }
    const normalizedAddress = normalizeAddress(deployment.address, AddressStringFormat.Lowercase)
    if (getHookDeploymentKey(deployment) !== selectedKey) {
      void navigate(getHookDetailsURL({ hookAddress: normalizedAddress, chainId: deployment.chainId }))
    }
  }

  if (chainIds.length <= 1) {
    return (
      <Flex row alignItems="center" gap="$spacing6">
        <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
        <Text variant="body3" color="$neutral2" className={media.md ? 'sr-only' : undefined}>
          {getChainInfo(chainId).label}
        </Text>
      </Flex>
    )
  }

  return (
    <NetworkFilter
      chainIds={chainIds}
      selectedChain={chainId}
      tieredOptions={tieredOptions}
      showSearchInput={false}
      triggerLabel={getChainInfo(chainId).label}
      selectionAnalytics={(nextChainId) => ({
        page: InterfacePageName.HookDetailsPage,
        element: ElementName.NetworkButton,
        hook_address: normalizeAddress(getDeployment(nextChainId)?.address ?? address, AddressStringFormat.Lowercase),
      })}
      trigger={
        media.md
          ? { variant: 'icon', chevronSize: 16 }
          : {
              variant: 'custom',
              content: (
                <Flex row alignItems="center" gap="$spacing6">
                  <NetworkLogo chainId={chainId} size={iconSizes.icon16} />
                  <Text variant="buttonLabel3" color="$neutral2">
                    {getChainInfo(chainId).label}
                  </Text>
                </Flex>
              ),
            }
      }
      placement="bottom-start"
      onPressChain={selectChain}
    />
  )
}

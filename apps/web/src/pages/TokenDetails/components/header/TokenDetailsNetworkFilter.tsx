import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, iconSizes } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions'
import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useNetworkFilterChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'
import { useActiveAddresses } from '~/features/accounts/store/hooks'

interface TokenDetailsNetworkFilterProps {
  chainIds: UniverseChainId[]
  selectedChainId: UniverseChainId | undefined
  setSelectedChainId: (chainId: UniverseChainId | undefined) => void
  showAddressCopy: boolean
  isChainDataLoading?: boolean
  showNetworkName?: boolean
  position?: 'left' | 'right'
}

export function TokenDetailsNetworkFilter({
  chainIds,
  showAddressCopy,
  selectedChainId,
  setSelectedChainId,
  isChainDataLoading,
  showNetworkName = true,
  position = 'left',
}: TokenDetailsNetworkFilterProps) {
  const { t } = useTranslation()
  const activeAddresses = useActiveAddresses()
  const tieredNetworkOptions = useNetworkSelectorOptions({ addresses: activeAddresses, chainIds })
  const { chainIds: selectableChainIds, allNetworksChainIds } = useNetworkFilterChainIds(chainIds)
  const isNetworkSubset = !isChainDataLoading && chainIds.length > 0 && allNetworksChainIds !== undefined

  const onPressChain = useEvent((chainId: UniverseChainId | null) => setSelectedChainId(chainId ?? undefined))

  if (chainIds.length <= 1) {
    return null
  }

  return (
    <Flex row alignItems="stretch">
      <Flex alignSelf="center">
        <NetworkFilter
          includeAllNetworks
          chainIds={selectableChainIds}
          allNetworksChainIds={allNetworksChainIds}
          selectedChain={selectedChainId ?? null}
          tieredOptions={tieredNetworkOptions}
          placement={position === 'left' ? 'bottom-start' : 'bottom-end'}
          selectionAnalytics={{ page: InterfacePageName.TokenDetailsPage }}
          trigger={{
            variant: 'custom',
            content: (
              <Flex row alignItems="center" gap="$spacing6">
                {selectedChainId ? (
                  <NetworkLogo chainId={selectedChainId} size={iconSizes.icon16} transition={HEADER_TRANSITION} />
                ) : isNetworkSubset ? (
                  <NetworkPile chainIds={chainIds} size="small" />
                ) : (
                  <NetworkLogo chainId={null} size={iconSizes.icon16} transition={HEADER_TRANSITION} />
                )}
                {showNetworkName && (
                  <Text variant="buttonLabel3" color="$neutral2" transition={HEADER_TRANSITION}>
                    {selectedChainId
                      ? getChainInfo(selectedChainId).label
                      : isNetworkSubset
                        ? t('explore.tokens.table.networks', { count: chainIds.length })
                        : t('transaction.network.all')}
                  </Text>
                )}
              </Flex>
            ),
          }}
          onPressChain={onPressChain}
        />
      </Flex>
      {showAddressCopy && <HeaderDivider />}
    </Flex>
  )
}

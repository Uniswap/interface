import { isExtensionApp, isWebApp } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { NetworkOption } from 'uniswap/src/components/network/NetworkOption'
import { useNewChainIds } from 'uniswap/src/features/chains/hooks/useNewChainIds'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

interface NetworkFilterContentProps {
  searchQuery: string
  tieredOptions?: TieredNetworkOptions
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  chainIds: UniverseChainId[]
  showAllNetworks: boolean
  allNetworksChainIds?: UniverseChainId[]
  forceAllNetworksLabel?: boolean
}

interface SelectableNetworkOptionProps {
  chainId: UniverseChainId | null
  selectedChain: UniverseChainId | null
  newChains: UniverseChainId[]
  onPressChain: (chainId: UniverseChainId | null) => void
  allNetworksChainIds?: UniverseChainId[]
  forceAllNetworksLabel?: boolean
}

function SectionHeader({ title }: { title: string }): JSX.Element {
  const media = useMedia()
  const shouldStickHeader = isExtensionApp || (isWebApp && !media.sm)

  return (
    <Flex
      backgroundColor="$surface1"
      pb="$spacing4"
      pt="$spacing8"
      px="$spacing8"
      $platform-web={shouldStickHeader ? { position: 'sticky', top: 0, zIndex: zIndexes.sticky } : undefined}
    >
      <Text color="$neutral2" variant="body4">
        {title}
      </Text>
    </Flex>
  )
}

function SelectableNetworkOption({
  chainId,
  selectedChain,
  newChains,
  onPressChain,
  allNetworksChainIds,
  forceAllNetworksLabel,
}: SelectableNetworkOptionProps): JSX.Element {
  const handlePress = useEvent((): void => {
    onPressChain(chainId)
  })

  return (
    <TouchableArea
      hoverable
      borderRadius="$rounded8"
      testID={`${ElementName.NetworkButton}-${chainId ?? 'all'}`}
      onPress={handlePress}
    >
      <NetworkOption
        forceAllNetworksLabel={forceAllNetworksLabel}
        chainId={chainId}
        chainIds={chainId === null ? allNetworksChainIds : undefined}
        currentlySelected={selectedChain === chainId}
        isNew={chainId !== null && newChains.includes(chainId)}
        borderRadius="$rounded16"
      />
    </TouchableArea>
  )
}

export function NetworkFilterContent({
  searchQuery,
  tieredOptions,
  selectedChain,
  onPressChain,
  chainIds,
  showAllNetworks,
  allNetworksChainIds,
  forceAllNetworksLabel,
}: NetworkFilterContentProps): JSX.Element {
  const { t } = useTranslation()
  const newChains = useNewChainIds()
  const hasVisibleOptions = chainIds.length > 0 || showAllNetworks

  if (!hasVisibleOptions) {
    return (
      <Flex pb="$spacing18">
        <NoResultsFound searchFilter={searchQuery} />
      </Flex>
    )
  }

  if (!tieredOptions) {
    return (
      <Flex gap="$spacing4" py="$spacing4" pl="$spacing2" pb="$spacing6">
        {showAllNetworks && (
          <SelectableNetworkOption
            chainId={null}
            selectedChain={selectedChain}
            newChains={newChains}
            allNetworksChainIds={allNetworksChainIds}
            forceAllNetworksLabel={forceAllNetworksLabel}
            onPressChain={onPressChain}
          />
        )}
        {chainIds.map((chainId) => (
          <SelectableNetworkOption
            key={chainId}
            chainId={chainId}
            selectedChain={selectedChain}
            newChains={newChains}
            onPressChain={onPressChain}
          />
        ))}
      </Flex>
    )
  }

  const hasWithBalances = tieredOptions.withBalances.length > 0
  const hasOtherNetworks = tieredOptions.otherNetworks.length > 0
  const withBalanceChainIds = tieredOptions.withBalances.map((option) => option.chainId)
  const otherNetworkChainIds = tieredOptions.otherNetworks.map((option) => option.chainId)

  return (
    <Flex gap="$spacing4" py="$spacing4" pl="$spacing2" pb="$spacing6">
      {showAllNetworks && (
        <SelectableNetworkOption
          chainId={null}
          selectedChain={selectedChain}
          newChains={newChains}
          allNetworksChainIds={allNetworksChainIds}
          forceAllNetworksLabel={forceAllNetworksLabel}
          onPressChain={onPressChain}
        />
      )}

      {hasWithBalances && (
        <>
          <SectionHeader title={t('network.filter.withBalances')} />
          {withBalanceChainIds.map((chainId) => (
            <SelectableNetworkOption
              key={chainId}
              chainId={chainId}
              selectedChain={selectedChain}
              newChains={newChains}
              onPressChain={onPressChain}
            />
          ))}
        </>
      )}

      {hasOtherNetworks && (
        <>
          <SectionHeader title={t('network.filter.otherNetworks')} />
          {otherNetworkChainIds.map((chainId) => (
            <SelectableNetworkOption
              key={chainId}
              chainId={chainId}
              selectedChain={selectedChain}
              newChains={newChains}
              onPressChain={onPressChain}
            />
          ))}
        </>
      )}
    </Flex>
  )
}

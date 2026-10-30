import type { UniverseChainId } from '@universe/chains'
import { isExtensionApp, isWebApp } from '@universe/environment'
import { Flex, Text, TouchableArea, zIndexes } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import type { NetworkSelectorOption, TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilter/types'
import { NetworkOption } from 'uniswap/src/components/network/NetworkOption'
import { useNewChainIds } from 'uniswap/src/features/chains/hooks/useNewChainIds'
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
  footer?: ReactNode
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

function NetworkOptionsSection({
  title,
  options,
  selectedChain,
  newChains,
  onPressChain,
}: {
  title?: string
  options: NetworkSelectorOption[]
  selectedChain: UniverseChainId | null
  newChains: UniverseChainId[]
  onPressChain: (chainId: UniverseChainId | null) => void
}): JSX.Element | null {
  if (options.length === 0) {
    return null
  }

  return (
    <>
      {title && <SectionHeader title={title} />}
      {options.map(({ chainId }) => (
        <SelectableNetworkOption
          key={chainId}
          chainId={chainId}
          selectedChain={selectedChain}
          newChains={newChains}
          onPressChain={onPressChain}
        />
      ))}
    </>
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
  footer,
}: NetworkFilterContentProps): JSX.Element {
  const { t } = useTranslation()
  const newChains = useNewChainIds()
  const hasVisibleOptions = chainIds.length > 0 || showAllNetworks
  const visibleFooter = searchQuery.trim() ? null : footer

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
        {visibleFooter}
      </Flex>
    )
  }

  const hasWithBalances = tieredOptions.withBalances.length > 0
  const lowLiquidity = tieredOptions.lowLiquidity ?? []

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
      <NetworkOptionsSection
        title={t('network.filter.withBalances')}
        options={tieredOptions.withBalances}
        selectedChain={selectedChain}
        newChains={newChains}
        onPressChain={onPressChain}
      />
      <NetworkOptionsSection
        title={hasWithBalances ? t('network.filter.otherNetworks') : undefined}
        options={tieredOptions.otherNetworks}
        selectedChain={selectedChain}
        newChains={newChains}
        onPressChain={onPressChain}
      />
      <NetworkOptionsSection
        title={t('network.filter.lowLiquidity')}
        options={lowLiquidity}
        selectedChain={selectedChain}
        newChains={newChains}
        onPressChain={onPressChain}
      />
      {visibleFooter}
    </Flex>
  )
}

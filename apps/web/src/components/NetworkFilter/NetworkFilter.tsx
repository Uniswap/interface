import { isWebApp } from '@universe/environment'
import type { Dispatch, SetStateAction } from 'react'
import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ScrollView, styled, Text, useMedia } from 'ui/src'
import type { FlexProps, TextProps } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import Badge from 'uniswap/src/components/badge/Badge'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkFilterDropdownContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterDropdownContent'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { NetworkOption } from 'uniswap/src/components/network/NetworkOption'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useNewChainIds } from 'uniswap/src/features/chains/hooks/useNewChainIds'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ALL_NETWORKS_LABEL } from 'uniswap/src/features/telemetry/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { ExploreTab } from '~/types/explore'

const NetworkLabel = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
})

// dropdown sizes per design
enum DropdownSizeVariants {
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
  XSmall = 'xsmall',
}

type DropdownSize = DropdownSizeVariants | 'large' | 'medium' | 'small' | 'xsmall'

const StyledDropdown = {
  maxHeight: 350,
  minWidth: 256,
  px: 0,
  py: 0,
} satisfies FlexProps

const NETWORK_SEARCH_DROPDOWN_CHROME_HEIGHT = 64

const ButtonStyles: Record<DropdownSizeVariants, FlexProps> = {
  [DropdownSizeVariants.Large]: {
    height: 48,
    pl: '$spacing16',
    pr: '$spacing12',
  },
  [DropdownSizeVariants.Medium]: {
    height: 40,
    pl: '$spacing12',
  },
  [DropdownSizeVariants.Small]: {
    height: 32,
    borderRadius: '$rounded12',
    pl: '$spacing12',
    gap: '$gap6',
  },
  [DropdownSizeVariants.XSmall]: {
    height: 28,
    borderRadius: '$rounded12',
    pl: '$spacing6',
    pr: '$spacing6',
    gap: '$gap4',
  },
}

const NetworkLogoSizes: Record<DropdownSizeVariants, number> = {
  [DropdownSizeVariants.Large]: iconSizes.icon24,
  [DropdownSizeVariants.Medium]: iconSizes.icon20,
  [DropdownSizeVariants.Small]: iconSizes.icon16,
  [DropdownSizeVariants.XSmall]: iconSizes.icon16,
}

const NetworkLabelTextVariants: Record<DropdownSizeVariants, TextProps['variant']> = {
  [DropdownSizeVariants.Large]: 'buttonLabel2',
  [DropdownSizeVariants.Medium]: 'buttonLabel3',
  [DropdownSizeVariants.Small]: 'buttonLabel4',
  [DropdownSizeVariants.XSmall]: 'buttonLabel4',
}

export function NetworkFilter({
  showMultichainOption = true,
  showDisplayName = false,
  position = 'left',
  onPress,
  currentChainId,
  size = DropdownSizeVariants.Medium,
  transition,
  networks,
  customTrigger,
  dropdownStyle,
  isTriggerStyled = true,
  tracePage,
  tab,
  forceFlipUp,
  positionFixed,
  showSearch = false,
  tieredOptions,
  forceAllNetworksLabel = false,
}: {
  showMultichainOption?: boolean
  showDisplayName?: boolean
  size?: DropdownSize
  position?: 'left' | 'right'
  onPress: (chainId: UniverseChainId | undefined) => void
  currentChainId: UniverseChainId | undefined
  transition?: FlexProps['transition']
  networks?: UniverseChainId[]
  customTrigger?: JSX.Element | string
  dropdownStyle?: FlexProps
  isTriggerStyled?: boolean
  tracePage?: InterfacePageName
  tab?: ExploreTab
  forceFlipUp?: boolean
  positionFixed?: boolean
  showSearch?: boolean
  tieredOptions?: TieredNetworkOptions
  forceAllNetworksLabel?: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const [isMenuOpen, toggleMenu] = useState(false)
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const filteredChainIds = useFilteredChainIds(networks)
  const allSupportedChainIds = useFilteredChainIds()
  const isNetworkSubset = filteredChainIds.length < allSupportedChainIds.length
  const allNetworksDisplayChainIds = isNetworkSubset ? filteredChainIds : undefined
  const chainInfo = currentChainId ? getChainInfo(currentChainId) : null
  const isAllNetworks = chainInfo === null
  const isMobileSheet = isWebApp && media.sm

  const tableNetworkItemRenderer = useCallback(
    (chainId: UniverseChainId) => {
      if (!isSupportedChainCallback(chainId)) {
        return null
      }
      // oxlint-disable-next-line no-shadow
      const chainInfo = getChainInfo(chainId)
      const supported = isBackendSupportedChainId(chainId)

      return (
        <TableNetworkItem
          key={chainId}
          chainInfo={chainInfo}
          tab={tab}
          toggleMenu={toggleMenu}
          tracePage={tracePage}
          unsupported={!supported}
          onPress={onPress}
          currentChainId={currentChainId}
        />
      )
    },
    [currentChainId, isSupportedChainCallback, onPress, tab, toggleMenu, tracePage],
  )

  return (
    <Flex>
      <Trace modal={ModalName.NetworkSelector}>
        <Dropdown
          isOpen={isMenuOpen}
          toggleOpen={toggleMenu}
          menuLabel={
            customTrigger ?? (
              <NetworkLabel testID={TestID.TokensNetworkFilterTrigger}>
                {(!currentChainId || !isSupportedChainCallback(currentChainId)) && showMultichainOption ? (
                  <NetworkLogo size={NetworkLogoSizes[size]} chainId={null} transition={transition} />
                ) : (
                  <ChainLogo
                    chainId={currentChainId ?? UniverseChainId.Mainnet}
                    size={NetworkLogoSizes[size]}
                    testId={TestID.TokensNetworkFilterSelected}
                    transition={transition}
                  />
                )}
                {showDisplayName && (
                  <Text variant={NetworkLabelTextVariants[size]} transition={transition}>
                    {isAllNetworks ? t('transaction.network.all') : chainInfo.label}
                  </Text>
                )}
              </NetworkLabel>
            )
          }
          isTriggerStyled={isTriggerStyled}
          buttonStyle={ButtonStyles[size]}
          dropdownStyle={{ ...StyledDropdown, ...dropdownStyle, ...(showSearch ? { overflow: 'hidden' } : {}) }}
          adaptToSheet
          allowFlip
          forceFlipUp={forceFlipUp}
          positionFixed={positionFixed}
          alignRight={position === 'right'}
        >
          {showSearch ? (
            <Flex p="$spacing4" pb="$spacing4">
              <NetworkFilterDropdownContent
                autoFocus={!isMobileSheet}
                chainIds={filteredChainIds}
                includeAllNetworks={showMultichainOption}
                allNetworksChainIds={showMultichainOption ? allNetworksDisplayChainIds : undefined}
                isOpen={isMenuOpen}
                maxHeight={
                  (typeof dropdownStyle?.maxHeight === 'number' ? dropdownStyle.maxHeight : StyledDropdown.maxHeight) -
                  NETWORK_SEARCH_DROPDOWN_CHROME_HEIGHT
                }
                selectedChain={currentChainId ?? null}
                tieredOptions={tieredOptions}
                forceAllNetworksLabel={forceAllNetworksLabel}
                onPressChain={(chainId) => {
                  onPress(chainId ?? undefined)
                  toggleMenu(false)
                }}
              />
            </Flex>
          ) : (
            <ScrollView>
              <Flex p="$spacing8">
                {showMultichainOption && (
                  <TableNetworkItem
                    forceAllNetworksLabel={forceAllNetworksLabel}
                    chainInfo={null}
                    chainIds={allNetworksDisplayChainIds}
                    tab={tab}
                    toggleMenu={toggleMenu}
                    tracePage={tracePage}
                    onPress={onPress}
                    currentChainId={currentChainId}
                  />
                )}
                {filteredChainIds.map(tableNetworkItemRenderer)}
              </Flex>
            </ScrollView>
          )}
        </Dropdown>
      </Trace>
    </Flex>
  )
}

const TableNetworkItem = memo(function TableNetworkItem({
  chainInfo,
  chainIds,
  tab,
  toggleMenu,
  tracePage,
  unsupported,
  onPress,
  currentChainId,
  forceAllNetworksLabel,
}: {
  chainInfo: UniverseChainInfo | null
  chainIds?: UniverseChainId[]
  tab?: ExploreTab
  toggleMenu: Dispatch<SetStateAction<boolean>>
  tracePage?: InterfacePageName
  onPress: (chainId: UniverseChainId | undefined) => void
  unsupported?: boolean
  currentChainId?: UniverseChainId | undefined
  forceAllNetworksLabel?: boolean
}) {
  const { t } = useTranslation()
  const currentChainInfo = currentChainId ? getChainInfo(currentChainId) : undefined
  const newChains = useNewChainIds()

  const isAllNetworks = chainInfo === null
  const chainId = isAllNetworks ? null : chainInfo.id
  const isNew = chainId !== null && newChains.includes(chainId)

  const chainName = chainId ? toGraphQLChain(chainId) : t('transaction.network.all')
  const isCurrentChain = isAllNetworks ? !currentChainInfo : currentChainInfo?.id === chainId

  const handlePress = () => {
    if (!unsupported) {
      onPress(chainId ?? undefined)
    }
    toggleMenu(false)
  }

  return (
    <Trace
      logPress
      {...(tracePage !== undefined ? { page: tracePage } : {})}
      properties={{
        ...(tab !== undefined ? { tab } : {}),
        chain: chainName.toString(),
        chain_id: chainId ?? ALL_NETWORKS_LABEL,
        chain_name: isAllNetworks ? ALL_NETWORKS_LABEL : chainInfo.label,
        previous_connected_chain: currentChainInfo?.id
          ? toGraphQLChain(currentChainInfo.id)
          : t('transaction.network.all'),
        previous_chain_id: currentChainInfo?.id ?? ALL_NETWORKS_LABEL,
        previous_chain_name: currentChainInfo ? currentChainInfo.label : ALL_NETWORKS_LABEL,
      }}
    >
      <Flex
        data-testid={`${TestID.TokensNetworkFilterOptionPrefix}${chainName.toLowerCase()}`}
        cursor={unsupported ? 'default' : 'pointer'}
        opacity={unsupported ? 0.6 : undefined}
        onPress={handlePress}
      >
        <NetworkOption
          chainId={chainId}
          chainIds={chainId === null ? chainIds : undefined}
          currentlySelected={isCurrentChain}
          isNew={isNew}
          forceAllNetworksLabel={forceAllNetworksLabel}
          trailingElement={unsupported ? <Badge fontSize={10}>{t('settings.setting.beta.tooltip')}</Badge> : undefined}
        />
      </Flex>
    </Trace>
  )
})

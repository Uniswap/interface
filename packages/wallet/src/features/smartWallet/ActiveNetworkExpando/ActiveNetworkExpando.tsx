import { useCallback } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, GetThemeValueForKey, HeightAnimator, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons'
import { iconSizes, padding, spacing } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { isMobileApp } from 'utilities/src/platform'
import {
  ITEM_PADDING,
  MAX_VISIBLE_HEIGHT_MOBILE,
  ROW_HEIGHT,
  TEXT_VARIANT,
} from 'wallet/src/features/smartWallet/ActiveNetworkExpando/constants'
import { useVisibleDelegations } from 'wallet/src/features/smartWallet/ActiveNetworkExpando/useVisibleDelegations'
import { ActiveDelegation } from 'wallet/src/features/smartWallet/types'

export function ActiveNetworkExpando({
  isOpen,
  activeDelegations,
  mt,
}: {
  isOpen: boolean
  activeDelegations: ActiveDelegation[]
  mt?: number | GetThemeValueForKey<'marginTop'>
}): JSX.Element | null {
  const colors = useSporeColors()

  const { maxHeight, visibleItems: displayData } = useVisibleDelegations({
    data: activeDelegations,
  })

  const renderActiveDelegationItem = useCallback(
    ({ item: { chainId, delegationAddress } }: { item: ActiveDelegation }) => (
      <ActiveNetworkRow
        key={`${chainId}-${delegationAddress}`}
        chainId={+chainId}
        delegationAddress={delegationAddress}
      />
    ),
    [],
  )

  if (!activeDelegations.length) {
    return null
  }

  return (
    <HeightAnimator useInitialHeight open={isOpen} animation="300ms" mt={mt}>
      {isOpen && (
        <Flex
          key="active-network-expando-container"
          py="$spacing4"
          animation="300ms"
          enterStyle={{ opacity: 0, scale: 0.95 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
        >
          <FlatList
            data={displayData}
            keyExtractor={({ chainId, delegationAddress }) => `${chainId}-${delegationAddress}`}
            renderItem={renderActiveDelegationItem}
            // only bounce if there's more to scroll
            bounces={isMobileApp && displayData.length * ROW_HEIGHT > MAX_VISIBLE_HEIGHT_MOBILE}
            style={{
              backgroundColor: colors.surface2.get(),
              borderRadius: spacing.spacing12,
              maxHeight,
              paddingHorizontal: padding.padding12,
            }}
            ItemSeparatorComponent={Separator}
          />
        </Flex>
      )}
    </HeightAnimator>
  )
}

function ActiveNetworkRow({ chainId, delegationAddress }: ActiveDelegation): JSX.Element | null {
  const scannerLink = getExplorerLink({ chainId, data: delegationAddress, type: ExplorerDataType.ADDRESS })

  const { label: networkName } = getChainInfo(chainId)

  return (
    <Flex row justifyContent="space-between" py={ITEM_PADDING}>
      <Flex row gap="$gap8">
        <NetworkLogo chainId={chainId} size={iconSizes.icon16} />
        <Text variant={TEXT_VARIANT} color="$neutral1">
          {networkName}
        </Text>
      </Flex>

      <Flex row alignItems="center" gap="$spacing4">
        <TouchableArea
          flexDirection="row"
          gap="$gap8"
          onPress={async (): Promise<void> => {
            await openUri({ uri: scannerLink })
          }}
        >
          <Text variant={TEXT_VARIANT} color="$neutral2">
            {shortenAddress({ address: delegationAddress })}
          </Text>
          <ExternalLink color="$neutral3" size="$icon.16" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

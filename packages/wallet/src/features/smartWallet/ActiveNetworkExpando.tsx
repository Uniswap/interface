import { useCallback } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons'
import { iconSizes, padding, spacing } from 'ui/src/theme'
import { fonts } from 'ui/src/theme/fonts'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { isMobileApp } from 'utilities/src/platform'
import { ActiveDelegation } from 'wallet/src/features/smartWallet/types'

const ITEM_PADDING = padding.padding12
const TEXT_VARIANT: keyof typeof fonts = 'body4'

const ROW_HEIGHT = 2 * ITEM_PADDING + fonts[TEXT_VARIANT].lineHeight

export function ActiveNetworkExpando({
  isOpen,
  activeDelegations,
}: {
  isOpen: boolean
  activeDelegations: ActiveDelegation[]
}): JSX.Element | null {
  const colors = useSporeColors()

  // ensures the flatlist doesn't cut off the last item on mobile
  const flatlistPaddingBottom = isMobileApp ? ROW_HEIGHT - ITEM_PADDING : undefined

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

  if (!isOpen || !activeDelegations.length) {
    return null
  }

  return (
    <FlatList
      data={activeDelegations}
      keyExtractor={({ chainId, delegationAddress }) => `${chainId}-${delegationAddress}`}
      renderItem={renderActiveDelegationItem}
      style={{
        backgroundColor: colors.surface2.get(),
        borderRadius: spacing.spacing12,
        maxHeight: '100%',
        height: ROW_HEIGHT * activeDelegations.length + (flatlistPaddingBottom || 0),
        paddingHorizontal: padding.padding12,
        paddingBottom: flatlistPaddingBottom,
      }}
      ItemSeparatorComponent={Separator}
    />
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
            {shortenAddress(delegationAddress)}
          </Text>
          <ExternalLink color="$neutral3" size="$icon.16" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

import React, { useCallback } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { RemoteImage } from 'uniswap/src/components/nfts/images/RemoteImage'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

function key(item: FORServiceProvider): string {
  return item.serviceProvider
}

const CEX_ICON_SIZE = iconSizes.icon36
const CEX_ICON_BORDER_RADIUS = 8

function CEXItemWrapper({
  serviceProvider,
  onSelectServiceProvider,
}: {
  serviceProvider: FORServiceProvider
  onSelectServiceProvider: (serviceProvider: FORServiceProvider) => void
}): JSX.Element | null {
  const onPress = (): void => onSelectServiceProvider(serviceProvider)

  const isDarkMode = useIsDarkMode()
  const logoUrl = getServiceProviderLogo(serviceProvider.logos, isDarkMode)

  return (
    <TouchableArea onPress={onPress}>
      <Flex
        fill
        row
        alignItems="center"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        gap="$spacing12"
        maxWidth="100%"
        mx="$spacing8"
        p="$spacing16"
      >
        <Flex grow row alignItems="center" flexShrink={1} gap="$spacing12">
          <RemoteImage
            borderRadius={CEX_ICON_BORDER_RADIUS}
            height={CEX_ICON_SIZE}
            resizeMode="cover"
            uri={logoUrl}
            width={CEX_ICON_SIZE}
          />
          <Text flexShrink={1} variant="body2">
            {serviceProvider.name}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function ServiceProviderSelector({
  onClose,
  serviceProviders,
}: {
  onClose: () => void
  serviceProviders: FORServiceProvider[]
}): JSX.Element {
  const onSelectServiceProvider = useCallback(
    (serviceProvider: FORServiceProvider) => {
      onClose()
      navigate(ModalName.ExchangeTransferModal, {
        initialState: { serviceProvider },
      })
    },
    [onClose],
  )

  const renderItem = useCallback(
    ({ item: serviceProvider }: ListRenderItemInfo<FORServiceProvider>) => (
      <CEXItemWrapper serviceProvider={serviceProvider} onSelectServiceProvider={onSelectServiceProvider} />
    ),
    [onSelectServiceProvider],
  )

  return (
    <Flex grow>
      <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
        <FlatList
          ItemSeparatorComponent={renderItemSeparator}
          bounces={true}
          data={serviceProviders}
          keyExtractor={key}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </AnimatedFlex>
    </Flex>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing12" />

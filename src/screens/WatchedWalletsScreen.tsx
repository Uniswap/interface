import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, Pressable } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { removeWatchedAddress } from 'src/features/favorites/slice'
import { Screens } from 'src/screens/Screens'

function WatchedWalletsItem({ address }: { address: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { navigate } = useExploreStackNavigation()

  return (
    <Pressable
      onPress={() => {
        navigate(Screens.User, { address })
      }}>
      <Flex alignItems="center" flexDirection="row" mx="lg" my="md">
        <Box flex={1}>
          <AddressDisplay
            showAddressAsSubtitle
            address={address}
            size={32}
            variant="subhead"
            verticalGap="none"
          />
        </Box>
        <TextButton
          borderColor="backgroundOutline"
          borderRadius="md"
          borderWidth={1}
          p="xs"
          textVariant="smallLabel"
          onPress={() => {
            dispatch(removeWatchedAddress({ address }))
          }}>
          {t('Remove')}
        </TextButton>
      </Flex>
    </Pressable>
  )
}

export function WatchedWalletsScreen() {
  const { t } = useTranslation()
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWallets = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const renderItem = useCallback(
    ({ item: address }: ListRenderItemInfo<string>) => <WatchedWalletsItem address={address} />,
    []
  )

  const headerText = t("Wallets you're watching")

  return (
    <HeaderListScreen
      ItemSeparatorComponent={() => <Separator mx="md" />}
      contentHeader={
        <Flex>
          <BackButton showButtonLabel />
          <Text variant="headlineSmall">{headerText}</Text>
        </Flex>
      }
      data={watchedWallets}
      fixedHeader={
        <BackHeader>
          <Text variant="subhead">{headerText}</Text>
        </BackHeader>
      }
      keyExtractor={(address) => address}
      renderItem={renderItem}
    />
  )
}

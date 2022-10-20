import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'

function WatchedWalletsItem({
  address,
  isWatched,
  onWatch,
  onUnwatch,
}: {
  address: string
  isWatched: boolean
  onWatch: () => void
  onUnwatch: () => void
}) {
  const { t } = useTranslation()
  const { navigate, preload } = useEagerExternalProfileNavigation()

  return (
    <Button onPress={() => navigate(address)} onPressIn={() => preload(address)}>
      <Flex alignItems="center" flexDirection="row" mx="lg" my="md">
        <Box flex={1}>
          <AddressDisplay
            showAddressAsSubtitle
            address={address}
            size={30}
            variant="subheadLarge"
            verticalGap="none"
          />
        </Box>
        <TextButton
          backgroundColor={isWatched ? 'none' : 'backgroundAction'}
          borderColor="backgroundOutline"
          borderRadius="md"
          borderWidth={1}
          p="xs"
          textVariant="buttonLabelSmall"
          onPress={isWatched ? onUnwatch : onWatch}>
          {isWatched ? t('Remove') : t('Watch')}
        </TextButton>
      </Flex>
    </Button>
  )
}

export function WatchedWalletsScreen() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const originalWallets = useRef(Array.from(watchedWalletsSet))

  const [unwatchedWallets, setUnwatchedWallets] = useState<string[]>([])

  useEffect(() => {
    const updatedUnwatchedWallets = originalWallets.current.filter(
      (wallet) => !watchedWalletsSet.has(wallet)
    )
    setUnwatchedWallets(updatedUnwatchedWallets)
  }, [watchedWalletsSet, originalWallets])

  const renderItem = useCallback(
    ({ item: address }: ListRenderItemInfo<string>) => {
      return (
        <WatchedWalletsItem
          address={address}
          isWatched={!unwatchedWallets.includes(address)}
          onUnwatch={() => {
            dispatch(removeWatchedAddress({ address }))
          }}
          onWatch={() => {
            dispatch(addWatchedAddress({ address }))
          }}
        />
      )
    },
    [unwatchedWallets, dispatch]
  )

  const headerText = t('Watched wallets')

  return (
    <HeaderListScreen
      InitialScreenHeader={
        <Flex>
          <BackButton showButtonLabel />
          <Text variant="headlineSmall">{headerText}</Text>
        </Flex>
      }
      ItemSeparatorComponent={() => <Separator mx="md" />}
      ScrolledScreenHeader={
        <BackHeader>
          <Text variant="subheadLarge">{headerText}</Text>
        </BackHeader>
      }
      data={originalWallets.current}
      keyExtractor={(address) => address}
      renderItem={renderItem}
    />
  )
}

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import Scan from 'src/assets/icons/qr-simple.svg'
import Settings from 'src/assets/icons/settings.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { ChainId } from 'src/constants/chains'
import { useFavoriteCurrencyBalances } from 'src/features/balances/hooks'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useENS } from 'src/features/ens/useENS'
import { selectFollowedAddressSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  const address = activeAccount?.address

  const following = useAppSelector(selectFollowedAddressSet)

  const { loading, favoriteBalances } = useFavoriteCurrencyBalances()

  const onPressScan = () => {
    selectionAsync()
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: WalletConnectModalState.WalletQr,
      })
    )
  }

  const onPressFriend = (friendAddres: string) => {
    selectionAsync()
    navigation.navigate(Screens.User, { address: friendAddres })
  }

  const onPressSettings = () => {
    selectionAsync()
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  if (!activeAccount || !address)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <Text>todo blank state</Text>
        </Box>
      </Screen>
    )

  return (
    <Screen>
      <GradientBackground opacity={1}>
        <BlueToDarkRadial />
      </GradientBackground>
      {/* nav header */}
      <Flex row justifyContent="space-between" mt="lg" mx="lg">
        <Text variant="h3">{t('Activity')}</Text>
        <Flex centered row gap="md">
          {isWalletConnectSupportedAccount(activeAccount) && (
            <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
              <Scan color={theme.colors.neutralTextSecondary} height={24} width={24} />
            </Button>
          )}
          <Button name={ElementName.Settings} onPress={onPressSettings}>
            <Settings color={theme.colors.neutralTextSecondary} height={24} width={24} />
          </Button>
        </Flex>
      </Flex>
      {/* profile info */}
      <Flex centered gap="sm" mt={'xl'}>
        <AddressDisplay
          address={address}
          captionVariant="mediumLabel"
          direction="column"
          showAddressAsSubtitle={true}
          showCopy={true}
          size={48}
          variant="h2"
        />

        {/* friends */}
        <Flex gap="sm" mt="lg" px="lg" width="100%">
          <Text color="neutralTextSecondary" variant="subHead1">
            {t('Friends')}
          </Text>
          <Flex row gap="sm">
            {[...following].map((a) => {
              return <FriendCard key={a} address={a} onPress={() => onPressFriend(a)} />
            })}
          </Flex>
        </Flex>
        {/* favorited tokens */}
        <Flex gap="xs" mt="lg" px="lg" width="100%">
          <TokenBalanceList
            balances={favoriteBalances as PortfolioBalance[]}
            header={
              <Text color="neutralTextSecondary" variant="subHead1">
                {t('Favorite tokens')}
              </Text>
            }
            loading={loading}
            refreshing={false}
            view={ViewType.Flat}
            onPressToken={() => {}}
            onRefresh={() => {}}
          />
        </Flex>
      </Flex>
    </Screen>
  )
}

function FriendCard({ address, onPress }: { address: string; onPress: () => void }) {
  const ens = useENS(ChainId.Mainnet, address)

  return (
    <Button onPress={onPress}>
      <Flex centered gap="sm">
        <Identicon address={address} />
        <Text variant="body1">{ens.name ?? shortenAddress(address)}</Text>
      </Flex>
    </Button>
  )
}

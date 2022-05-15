import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { selectionAsync } from 'expo-haptics'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import QRIcon from 'src/assets/icons/qr-code.svg'
import Scan from 'src/assets/icons/scan.svg'
import SendIcon from 'src/assets/icons/send.svg'
import Settings from 'src/assets/icons/settings.svg'
import AddressEnsDisplay from 'src/components/accounts/AddressEnsDisplay'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TokenBalanceList, ViewType } from 'src/components/TokenBalanceList/TokenBalanceList'
import { ChainId } from 'src/constants/chains'
import { useFavoriteCurrencyBalances } from 'src/features/balances/hooks'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useENS } from 'src/features/ens/useENS'
import { selectFollowedAddressSet } from 'src/features/favorites/selectors'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { WalletConnectScanSheet } from 'src/features/walletConnect/WalletConnectScanSheet'
import { Screens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { opacify } from 'src/utils/colors'
import { isWalletConnectSupportedAccount } from 'src/utils/walletConnect'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false)

  const activeAccount = useActiveAccount()
  const address = activeAccount?.address

  const following = useAppSelector(selectFollowedAddressSet)

  const { loading, favoriteBalances } = useFavoriteCurrencyBalances()

  const onPressScan = () => {
    selectionAsync()
    setShowWalletConnectModal(true)
  }

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

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
      <Flex row justifyContent="space-between" mt="lg" mx="lg">
        <Text variant={'h3'}>Profile</Text>
        <Flex centered row gap="md">
          {isWalletConnectSupportedAccount(activeAccount) && (
            <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
              <Scan color="gray100" height={20} width={20} />
            </Button>
          )}
          <Button name={ElementName.Settings} onPress={onPressSettings}>
            <Settings color="gray100" height={24} width={24} />
          </Button>
        </Flex>
      </Flex>
      <Flex centered gap="sm" mt={'xl'}>
        <Identicon address={activeAccount.address} size={40} />
        <AddressEnsDisplay address={address} align="center" gap="xs" mainSize={18} />
        <Flex centered row gap="sm" mt="sm">
          <Button
            borderColor={'deprecated_gray100'}
            borderRadius={'lg'}
            borderWidth={1}
            p="md"
            style={{ backgroundColor: opacify(6, theme.colors.deprecated_blue) }}
            onPress={() => setShowWalletConnectModal(true)}>
            <QRIcon height={16} width={16} />
          </Button>
          <Button
            borderColor={'deprecated_gray100'}
            borderRadius={'lg'}
            borderWidth={1}
            p="md"
            style={{ backgroundColor: opacify(6, theme.colors.deprecated_blue) }}>
            <SendIcon
              color={theme.colors.deprecated_textColor}
              height={16}
              strokeWidth={3}
              width={16}
            />
          </Button>
        </Flex>
        <Text
          color="deprecated_textColor"
          onPress={() =>
            navigation.push(Screens.User, {
              address: '0x74Aa01d162E6dC6A657caC857418C403D48E2D77',
            })
          }>
          View friend
        </Text>
        <Flex gap="sm" mt="lg" px="lg" width="100%">
          <Text color="deprecated_gray400" variant="subHead1">
            {t('Following')}
          </Text>
          <Flex row gap="sm">
            {[...following].map((a) => {
              return (
                <FriendCard
                  key={a}
                  address={a}
                  onPress={() => navigation.push(Screens.User, { address: a })}
                />
              )
            })}
          </Flex>
        </Flex>
        <Flex gap="xs" mt="lg" px="lg" width="100%">
          <TokenBalanceList
            balances={favoriteBalances as PortfolioBalance[]}
            header={
              <Text color="deprecated_gray400" variant="subHead1">
                {t('Favorite Tokens')}
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
      <WalletConnectScanSheet
        isVisible={showWalletConnectModal}
        onClose={() => setShowWalletConnectModal(false)}
      />
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

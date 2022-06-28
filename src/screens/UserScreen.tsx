import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useAppStackNavigation } from 'src/app/navigation/types'
import EyeIcon from 'src/assets/icons/eye.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PortfolioNFTSection } from 'src/components/home/PortfolioNFTSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { ScrollDetailScreen } from 'src/components/layout/ScrollDetailScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<AppStackParamList, Screens.User>

export function UserScreen({
  route: {
    params: { address },
  },
}: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()
  const displayName = useDisplayName(address)

  const isWatching = useAppSelector(selectWatchedAddressSet).has(address)

  const onSendPress = async () => {
    navigation.navigate(Screens.Transfer, {
      transferFormState: {
        recipient: address,
        exactAmountToken: '',
        exactAmountUSD: '',
        exactCurrencyField: CurrencyField.INPUT,
        [CurrencyField.INPUT]: null,
        [CurrencyField.OUTPUT]: null,
      },
    })
  }

  const onWatchPress = () => {
    if (isWatching) {
      dispatch(removeWatchedAddress({ address }))
    } else {
      dispatch(addWatchedAddress({ address }))
    }
  }

  if (!address)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <Text>todo blank state</Text>
        </Box>
      </Screen>
    )

  return (
    <ScrollDetailScreen
      background={
        <GradientBackground opacity={1}>
          <BlueToDarkRadial />
        </GradientBackground>
      }
      contentHeader={
        <AddressDisplay
          address={address}
          captionVariant="mediumLabel"
          direction="column"
          showAddressAsSubtitle={true}
          showCopy={true}
          size={48}
          variant="headlineMedium"
        />
      }
      title={displayName?.name}>
      <VirtualizedList>
        <Flex gap="lg" px="md">
          {/* profile info */}
          <Flex centered row gap="xs" mt="md">
            <PrimaryButton
              borderRadius="lg"
              icon={
                <SendIcon
                  height={20}
                  stroke={theme.colors.textPrimary}
                  strokeWidth={3}
                  width={20}
                />
              }
              label={t('Send')}
              px="lg"
              variant="transparent"
              onPress={onSendPress}
            />
            <PrimaryButton
              borderRadius="lg"
              icon={
                <EyeIcon height={20} stroke={theme.colors.textPrimary} strokeWidth={2} width={20} />
              }
              label={isWatching ? t('Remove') : t('Watch')}
              px="lg"
              variant="transparent"
              onPress={onWatchPress}
            />
          </Flex>
          <PortfolioNFTSection count={4} owner={address} />
          <PortfolioTokensSection count={3} owner={address} />
        </Flex>
      </VirtualizedList>
    </ScrollDetailScreen>
  )
}

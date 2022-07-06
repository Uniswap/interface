import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList, useAppStackNavigation } from 'src/app/navigation/types'
import EyeIcon from 'src/assets/icons/eye.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PortfolioNFTsSection } from 'src/components/home/PortfolioNFTsSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<ExploreStackParamList, Screens.User>

export function UserScreen({
  route: {
    params: { address },
  },
}: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()

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
    <HeaderScrollScreen
      background={
        <GradientBackground opacity={1}>
          <BlueToDarkRadial />
        </GradientBackground>
      }
      contentHeader={
        <Flex gap="md">
          <BackButton showButtonLabel />
          <AddressDisplay
            address={address}
            captionVariant="mediumLabel"
            direction="column"
            showAddressAsSubtitle={true}
            showCopy={true}
            size={48}
            variant="headlineMedium"
          />
        </Flex>
      }
      fixedHeader={
        <BackHeader>
          <AddressDisplay address={address} captionVariant="subhead" size={16} />
        </BackHeader>
      }>
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
              label={isWatching ? t('Unwatch') : t('Watch')}
              px="lg"
              variant="transparent"
              onPress={onWatchPress}
            />
          </Flex>
          <PortfolioNFTsSection count={4} owner={address} />
          <PortfolioTokensSection count={3} owner={address} />
        </Flex>
      </VirtualizedList>
    </HeaderScrollScreen>
  )
}

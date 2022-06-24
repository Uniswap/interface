import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList, useAppStackNavigation } from 'src/app/navigation/types'
import EyeIcon from 'src/assets/icons/eye.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PortfolioNFTSection } from 'src/components/home/PortfolioNFTSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
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

  const isWatching = useAppSelector(selectWatchedAddressSet).has(address)

  const onSendPress = async () => {
    navigation.navigate(Screens.Transfer, {
      transferFormState: {
        recipient: address,
        exactAmount: '',
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
    <Screen>
      <GradientBackground opacity={1}>
        <BlueToDarkRadial />
      </GradientBackground>
      <VirtualizedList>
        <Flex gap="lg" mt="sm" px="md">
          {/* header */}
          <Button onPress={() => navigation.goBack()}>
            <Flex row alignItems="center" gap="xs">
              <BackButton color="textSecondary" size={14} />
              <Text color="textSecondary" variant="smallLabel">
                Back
              </Text>
            </Flex>
          </Button>

          {/* profile info */}
          <Flex centered gap="md" my="md">
            <AddressDisplay
              address={address}
              captionVariant="mediumLabel"
              direction="column"
              showAddressAsSubtitle={true}
              showCopy={true}
              size={48}
              variant="h2"
            />
            <Flex centered row gap="xs">
              <PrimaryButton
                borderRadius="lg"
                icon={
                  <SendIcon
                    height={20}
                    stroke={theme.colors.mainForeground}
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
                  <EyeIcon
                    height={20}
                    stroke={theme.colors.mainForeground}
                    strokeWidth={2}
                    width={20}
                  />
                }
                label={isWatching ? t('Remove') : t('Watch')}
                px="lg"
                variant="transparent"
                onPress={onWatchPress}
              />
            </Flex>
          </Flex>
          <PortfolioTokensSection count={4} owner={address} />
          <PortfolioNFTSection count={16} owner={address} />
        </Flex>
      </VirtualizedList>
    </Screen>
  )
}

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList } from 'src/app/navigation/types'
import EyeIcon from 'src/assets/icons/eye.svg'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
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
import { TransactionListSection } from 'src/components/TransactionList/TransactionListSection'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
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

  const isWatching = useAppSelector(selectWatchedAddressSet).has(address)
  const { combinedTransactionList } = useAllFormattedTransactions(address)

  const onWatchPress = () => {
    if (isWatching) {
      dispatch(removeWatchedAddress({ address }))
    } else {
      dispatch(addWatchedAddress({ address }))
    }
  }

  const initialSendState = useMemo(() => {
    return {
      recipient: address,
      exactAmountToken: '',
      exactAmountUSD: '',
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    }
  }, [address])

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
        <Flex gap="lg" mb="md" px="md">
          {/* profile info */}
          <Flex centered row gap="xs" mt="md">
            <SendButton
              borderRadius="lg"
              iconStrokeWidth={3}
              initialState={initialSendState}
              px="lg"
            />
            <PrimaryButton
              borderRadius="lg"
              icon={
                isWatching ? (
                  <EyeOffIcon color={theme.colors.textPrimary} height={20} width={20} />
                ) : (
                  <EyeIcon
                    color={theme.colors.textPrimary}
                    height={20}
                    strokeWidth={2}
                    width={20}
                  />
                )
              }
              label={isWatching ? t('Unwatch') : t('Watch')}
              px="lg"
              variant="transparent"
              onPress={onWatchPress}
            />
          </Flex>
          {combinedTransactionList.length > 0 && (
            <TransactionListSection owner={address} transactions={combinedTransactionList} />
          )}
          <PortfolioNFTsSection count={4} owner={address} />
          <PortfolioTokensSection count={3} owner={address} />
        </Flex>
      </VirtualizedList>
    </HeaderScrollScreen>
  )
}

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { Route } from 'react-native-tab-view'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Flex } from 'src/components/layout'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import ProfileActivityTab from 'src/components/profile/tabs/ProfileActivityTab'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<AppStackParamList, Screens.ExternalProfile>

const TOKENS_KEY = 'profile-tokens'
const NFTS_KEY = 'profile-nfts'
const ACTIVITY_KEY = 'profile-activity'

export function ExternalProfileScreen({
  route: {
    params: { address, preloadedQuery },
  },
}: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const isWatching = useAppSelector(selectWatchedAddressSet).has(address)

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

  const tabs = useMemo(
    () => [
      { key: ACTIVITY_KEY, title: t('Activity') },
      { key: NFTS_KEY, title: t('NFTs') },
      { key: TOKENS_KEY, title: t('Tokens') },
    ],
    [t]
  )

  const renderTab = useCallback(
    (route: Route, scrollProps: TabViewScrollProps, loadingContainerStyle: ViewStyle) => {
      switch (route?.key) {
        case ACTIVITY_KEY:
          return (
            <ProfileActivityTab
              ownerAddress={address}
              preloadedQuery={preloadedQuery}
              tabViewScrollProps={scrollProps}
            />
          )
        case NFTS_KEY:
          return (
            <NftsTab
              loadingContainerStyle={loadingContainerStyle}
              owner={address}
              tabViewScrollProps={scrollProps}
            />
          )
        case TOKENS_KEY:
          return (
            <TokensTab
              loadingContainerStyle={loadingContainerStyle}
              owner={address}
              tabViewScrollProps={scrollProps}
            />
          )
      }
      return null
    },
    [address, preloadedQuery]
  )

  return (
    <TabbedScrollScreen
      disableOpenSidebarGesture
      contentHeader={
        <Flex gap="sm" mb="sm" mx="md">
          <BackButton showButtonLabel />
          <AddressDisplay
            address={address}
            captionVariant="subheadLarge"
            direction="column"
            showAddressAsSubtitle={true}
            showCopy={true}
            size={48}
            variant="headlineMedium"
          />
          <Flex centered row gap="xs" my="md" px="xl">
            <SendButton
              borderRadius="lg"
              flexBasis="49%"
              iconStrokeWidth={3}
              initialState={initialSendState}
              px="lg"
            />
            <PrimaryButton
              borderRadius="lg"
              flexBasis="49%"
              icon={
                isWatching ? (
                  <EyeOffIcon color={theme.colors.textPrimary} height={20} width={20} />
                ) : (
                  <EyeIcon
                    color={theme.colors.textPrimary}
                    height={20}
                    strokeWidth={1.5}
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
        </Flex>
      }
      renderTab={renderTab}
      tabs={tabs}
    />
  )
}

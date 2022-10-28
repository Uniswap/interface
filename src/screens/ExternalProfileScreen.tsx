import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import SendIcon from 'src/assets/icons/send.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { renderTabLabel, TabStyles } from 'src/components/layout/screens/TabbedScrollScreen'
import ProfileActivityTab from 'src/components/profile/tabs/ProfileActivityTab'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
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
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [tabIndex, setIndex] = useState(0)

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
    ({ route }) => {
      switch (route?.key) {
        case ACTIVITY_KEY:
          return <ProfileActivityTab ownerAddress={address} preloadedQuery={preloadedQuery} />
        case NFTS_KEY:
          return <NftsTab owner={address} />
        case TOKENS_KEY:
          return <TokensTab owner={address} />
      }
      return null
    },
    [address, preloadedQuery]
  )

  const onPressSend = useCallback(() => {
    dispatch(
      openModal({
        name: ModalName.Send,
        ...{ initialState: initialSendState },
      })
    )
  }, [dispatch, initialSendState])

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <TabBar
          {...sceneProps}
          indicatorStyle={[TabStyles.indicator]}
          navigationState={{ index: tabIndex, routes: tabs }}
          renderLabel={renderTabLabel}
          style={[TabStyles.tab, { backgroundColor: theme.colors.background0 }]}
        />
      )
    },
    [tabIndex, tabs, theme]
  )

  return (
    <>
      <Screen edges={['top', 'left', 'right']}>
        <Flex grow>
          <Flex gap="sm" mb="sm" mx="md">
            <BackButton showButtonLabel />
            <AddressDisplay
              address={address}
              captionVariant="subheadLarge"
              direction="column"
              showCopy={true}
              size={48}
              variant="headlineMedium"
            />
            <Flex centered row gap="md" my="md" px="xl">
              <Button
                fill
                IconName={SendIcon}
                emphasis={ButtonEmphasis.Tertiary}
                label={t('Send')}
                name={ElementName.Send}
                size={ButtonSize.Medium}
                onPress={onPressSend}
              />
              <Button
                fill
                IconName={isWatching ? EyeOffIcon : EyeIcon}
                emphasis={ButtonEmphasis.Tertiary}
                label={isWatching ? t('Unwatch') : t('Watch')}
                size={ButtonSize.Medium}
                onPress={onWatchPress}
              />
            </Flex>
          </Flex>
          <TabView
            navigationState={{ index: tabIndex, routes: tabs }}
            renderScene={renderTab}
            renderTabBar={renderTabBar}
            style={TabStyles.tabView}
            onIndexChange={setIndex}
          />
        </Flex>
      </Screen>
    </>
  )
}

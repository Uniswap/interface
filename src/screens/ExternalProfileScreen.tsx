import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
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
import TraceTabView from 'src/components/telemetry/TraceTabView'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<AppStackParamList, Screens.ExternalProfile>

export function ExternalProfileScreen({
  route: {
    params: { address },
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
      { key: SectionName.ProfileActivityTab, title: t('Activity') },
      { key: SectionName.ProfileNftsTab, title: t('NFTs') },
      { key: SectionName.ProfileTokensTab, title: t('Tokens') },
    ],
    [t]
  )

  const renderTab = useCallback(
    ({ route }) => {
      switch (route?.key) {
        case SectionName.ProfileActivityTab:
          return <ProfileActivityTab ownerAddress={address} />
        case SectionName.ProfileNftsTab:
          return <NftsTab owner={address} />
        case SectionName.ProfileTokensTab:
          return <TokensTab owner={address} />
      }
      return null
    },
    [address]
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
          style={[
            TabStyles.tab,
            {
              backgroundColor: theme.colors.background0,
              borderBottomColor: theme.colors.backgroundOutline,
            },
          ]}
        />
      )
    },
    [tabIndex, tabs, theme]
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Flex grow>
        <Flex gap="sm" mb="sm" mx="md">
          <BackButton />
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
        <TraceTabView
          navigationState={{ index: tabIndex, routes: tabs }}
          renderScene={renderTab}
          renderTabBar={renderTabBar}
          style={TabStyles.tabView}
          onIndexChange={setIndex}
        />
      </Flex>
    </Screen>
  )
}

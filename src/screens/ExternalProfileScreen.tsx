import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { renderTabLabel, TabContentProps, TAB_STYLES } from 'src/components/layout/TabHelpers'
import ProfileActivityTab from 'src/components/profile/tabs/ProfileActivityTab'
import TraceTabView from 'src/components/telemetry/TraceTabView'
import ProfileHeader from 'src/features/externalProfile/ProfileHeader'
import { SectionName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<AppStackParamList, Screens.ExternalProfile>

export function ExternalProfileScreen({
  route: {
    params: { address },
  },
}: Props): ReactElement {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [tabIndex, setIndex] = useState(0)

  const tabs = useMemo(
    () => [
      { key: SectionName.ProfileTokensTab, title: t('Tokens') },
      { key: SectionName.ProfileNftsTab, title: t('NFTs') },
      { key: SectionName.ProfileActivityTab, title: t('Activity') },
    ],
    [t]
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      contentContainerStyle: TAB_STYLES.tabListInner,
      loadingContainerStyle: TAB_STYLES.tabListInner,
    }),
    []
  )

  const renderTab = useCallback(
    ({ route }) => {
      switch (route?.key) {
        case SectionName.ProfileActivityTab:
          return <ProfileActivityTab ownerAddress={address} />
        case SectionName.ProfileNftsTab:
          return <NftsTab containerProps={sharedProps} owner={address} />
        case SectionName.ProfileTokensTab:
          return <TokensTab containerProps={sharedProps} owner={address} />
      }
      return null
    },
    [address, sharedProps]
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <TabBar
          {...sceneProps}
          indicatorStyle={TAB_STYLES.activeTabIndicator}
          navigationState={{ index: tabIndex, routes: tabs }}
          renderLabel={renderTabLabel}
          style={[
            TAB_STYLES.tabBar,
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
    <Screen edges={[]}>
      <Flex grow>
        <ProfileHeader address={address} />
        <TraceTabView
          navigationState={{ index: tabIndex, routes: tabs }}
          renderScene={renderTab}
          renderTabBar={renderTabBar}
          screenName={Screens.ExternalProfile}
          onIndexChange={setIndex}
        />
      </Flex>
    </Screen>
  )
}

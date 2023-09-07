import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import { ActivityTab } from 'src/components/home/ActivityTab'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { renderTabLabel, TabContentProps, TAB_STYLES } from 'src/components/layout/TabHelpers'
import Trace from 'src/components/Trace/Trace'
import TraceTabView from 'src/components/Trace/TraceTabView'
import ProfileHeader from 'src/features/externalProfile/ProfileHeader'
import { SectionName } from 'src/features/telemetry/constants'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<AppStackParamList, Screens.ExternalProfile>

export function ExternalProfileScreen({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [tabIndex, setIndex] = useState(0)
  const insets = useSafeAreaInsets()

  const displayName = useDisplayName(address)

  const tabs = useMemo(
    () => [
      { key: SectionName.ProfileTokensTab, title: t('Tokens') },
      { key: SectionName.ProfileNftsTab, title: t('NFTs') },
      { key: SectionName.ProfileActivityTab, title: t('Activity') },
    ],
    [t]
  )

  const containerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      ...TAB_STYLES.tabListInner,
      paddingBottom: insets.bottom + TAB_STYLES.tabListInner.paddingBottom,
    }),
    [insets.bottom]
  )

  const emptyContainerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: theme.spacing.spacing60,
      paddingHorizontal: theme.spacing.spacing36,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom, theme.spacing.spacing36, theme.spacing.spacing60]
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      contentContainerStyle: containerStyle,
      loadingContainerStyle: containerStyle,
      emptyContainerStyle,
    }),
    [containerStyle, emptyContainerStyle]
  )

  const renderTab = useCallback(
    ({
      route,
    }: {
      route: {
        key: SectionName
        title: string
      }
    }) => {
      switch (route?.key) {
        case SectionName.ProfileActivityTab:
          return <ActivityTab isExternalProfile containerProps={sharedProps} owner={address} />
        case SectionName.ProfileNftsTab:
          return <NftsTab isExternalProfile containerProps={sharedProps} owner={address} />
        case SectionName.ProfileTokensTab:
          return <TokensTab isExternalProfile containerProps={sharedProps} owner={address} />
      }
      return null
    },
    [address, sharedProps]
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <Box bg="surface1" paddingLeft="spacing12">
          <TabBar
            {...sceneProps}
            indicatorStyle={TAB_STYLES.activeTabIndicator}
            navigationState={{ index: tabIndex, routes: tabs }}
            renderLabel={({ route, focused }): JSX.Element =>
              renderTabLabel({ route, focused, isExternalProfile: true })
            }
            style={[
              TAB_STYLES.tabBar,
              {
                backgroundColor: theme.colors.surface1,
                borderBottomColor: theme.colors.surface3,
              },
            ]}
            tabStyle={styles.tabStyle}
          />
        </Box>
      )
    },
    [tabIndex, tabs, theme]
  )

  const traceProperties = useMemo(
    () => ({ address, walletName: displayName?.name }),
    [address, displayName?.name]
  )

  return (
    <ExploreModalAwareView>
      <Screen noInsets>
        <Trace
          directFromPage
          logImpression
          properties={traceProperties}
          screen={Screens.ExternalProfile}>
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
        </Trace>
      </Screen>
    </ExploreModalAwareView>
  )
}

const styles = StyleSheet.create({
  tabStyle: { width: 'auto' },
})

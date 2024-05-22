import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { AppStackParamList } from 'src/app/navigation/types'
import { ActivityTab } from 'src/components/home/ActivityTab'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Screen } from 'src/components/layout/Screen'
import { renderTabLabel, TAB_STYLES, TabContentProps } from 'src/components/layout/TabHelpers'
import Trace from 'src/components/Trace/Trace'
import TraceTabView from 'src/components/Trace/TraceTabView'
import { ProfileHeader } from 'src/features/externalProfile/ProfileHeader'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { Flex, useDeviceInsets, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { SectionName, SectionNameType } from 'wallet/src/telemetry/constants'

type Props = NativeStackScreenProps<AppStackParamList, Screens.ExternalProfile> & {
  renderedInModal?: boolean
}

export function ExternalProfileScreen({
  route: {
    params: { address },
  },
  renderedInModal = false,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [tabIndex, setIndex] = useState(0)
  const insets = useDeviceInsets()

  const displayName = useDisplayName(address)

  const tabs = useMemo(
    () => [
      { key: SectionName.ProfileTokensTab, title: t('home.tokens.title') },
      { key: SectionName.ProfileNftsTab, title: t('home.nfts.title') },
      { key: SectionName.ProfileActivityTab, title: t('home.activity.title') },
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
      paddingTop: spacing.spacing60,
      paddingHorizontal: spacing.spacing36,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom]
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
        key: SectionNameType
        title: string
      }
    }) => {
      switch (route?.key) {
        case SectionName.ProfileActivityTab:
          return (
            <ActivityTab
              isExternalProfile
              containerProps={sharedProps}
              owner={address}
              renderedInModal={renderedInModal}
            />
          )
        case SectionName.ProfileNftsTab:
          return (
            <NftsTab
              isExternalProfile
              containerProps={sharedProps}
              owner={address}
              renderedInModal={renderedInModal}
            />
          )
        case SectionName.ProfileTokensTab:
          return (
            <TokensTab
              isExternalProfile
              containerProps={sharedProps}
              owner={address}
              renderedInModal={renderedInModal}
            />
          )
      }
      return null
    },
    [address, sharedProps, renderedInModal]
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <TabBar
          {...sceneProps}
          indicatorStyle={TAB_STYLES.activeTabIndicator}
          navigationState={{ index: tabIndex, routes: tabs }}
          pressColor={colors.surface3.val} // Android only
          renderLabel={({ route, focused }): JSX.Element =>
            renderTabLabel({ route, focused, isExternalProfile: true })
          }
          style={[
            TAB_STYLES.tabBar,
            {
              backgroundColor: colors.surface1.get(),
              borderBottomColor: colors.surface3.get(),
              paddingLeft: spacing.spacing12,
            },
          ]}
          tabStyle={styles.tabStyle}
        />
      )
    },
    [colors.surface1, colors.surface3, tabIndex, tabs]
  )

  const traceProperties = useMemo(
    () => ({
      address,
      walletName: displayName?.name,
      displayNameType: displayName?.type ? DisplayNameType[displayName.type] : undefined,
    }),
    [address, displayName?.name, displayName?.type]
  )

  return (
    <ExploreModalAwareView>
      <Screen noInsets>
        <Trace
          directFromPage
          logImpression
          properties={traceProperties}
          screen={Screens.ExternalProfile}>
          <Flex grow gap="$spacing16">
            <ProfileHeader address={address} />
            <TraceTabView
              lazy
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

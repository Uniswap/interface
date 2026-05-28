import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { SceneRendererProps, TabBar } from 'react-native-tab-view'
import { AppStackParamList } from 'src/app/navigation/types'
import { ActivityContent } from 'src/components/activity/ActivityContent'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Screen } from 'src/components/layout/Screen'
import { TAB_STYLES, TabContentProps, TabLabel } from 'src/components/layout/TabHelpers'
import TraceTabView from 'src/components/Trace/TraceTabView'
import { ProfileHeader } from 'src/features/externalProfile/ProfileHeader'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Flex, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<AppStackParamList, MobileScreens.ExternalProfile> & {
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
  const insets = useAppInsets()

  const displayName = useDisplayName(address)

  const tabs = useMemo(
    () => [
      { key: SectionName.ProfileTokensTab, title: t('home.tokens.title') },
      { key: SectionName.ProfileNftsTab, title: t('home.nfts.title') },
      { key: SectionName.ProfileActivityTab, title: t('home.activity.title') },
    ],
    [t],
  )

  const containerStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      ...TAB_STYLES.tabListInner,
      paddingBottom: insets.bottom + TAB_STYLES.tabListInner.paddingBottom,
    }),
    [insets.bottom],
  )

  const emptyComponentStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      paddingTop: spacing.spacing48,
      paddingHorizontal: spacing.spacing36,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom],
  )

  const sharedProps = useMemo<TabContentProps>(
    () => ({
      contentContainerStyle: containerStyle,
      loadingContainerStyle: containerStyle,
      emptyComponentStyle,
    }),
    [containerStyle, emptyComponentStyle],
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
      switch (route.key) {
        case SectionName.ProfileActivityTab:
          return (
            <ActivityContent
              isExternalProfile
              containerProps={sharedProps}
              owner={address}
              renderedInModal={renderedInModal}
            />
          )
        case SectionName.ProfileNftsTab:
          return (
            <NftsTab isExternalProfile containerProps={sharedProps} owner={address} renderedInModal={renderedInModal} />
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
    [address, sharedProps, renderedInModal],
  )

  const renderTabBar = useCallback(
    (sceneProps: SceneRendererProps) => {
      return (
        <TabBar
          {...sceneProps}
          indicatorStyle={TAB_STYLES.activeTabIndicator}
          navigationState={{ index: tabIndex, routes: tabs }}
          pressColor="transparent" // Android only
          renderLabel={({ route, focused }): JSX.Element => (
            <TabLabel isExternalProfile focused={focused} route={route} />
          )}
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
    [colors.surface1, colors.surface3, tabIndex, tabs],
  )

  const traceProperties = useMemo(
    () => ({
      address,
      walletName: displayName?.name,
      displayNameType: displayName?.type ? DisplayNameType[displayName.type] : undefined,
    }),
    [address, displayName?.name, displayName?.type],
  )

  return (
    <ExploreModalAwareView>
      <Screen noInsets>
        <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.ExternalProfile}>
          <Flex grow gap="$spacing16">
            <ProfileHeader address={address} />
            <TraceTabView
              lazy
              navigationState={{ index: tabIndex, routes: tabs }}
              renderScene={renderTab}
              renderTabBar={renderTabBar}
              screenName={MobileScreens.ExternalProfile}
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

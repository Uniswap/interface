import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { Route, TabView, TabViewProps } from 'react-native-tab-view'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

type TraceRouteProps = { key: SectionName } & Route

export default function TraceTabView<T extends TraceRouteProps>({
  onIndexChange,
  navigationState,
  screenName,
  ...rest
}: TabViewProps<T> & { screenName: MobileScreens }): JSX.Element {
  const onIndexChangeTrace = (index: number): void => {
    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: navigationState.routes[index]?.key,
      screen: screenName,
    })
    onIndexChange(index)
  }

  return <TabView navigationState={navigationState} onIndexChange={onIndexChangeTrace} {...rest} />
}

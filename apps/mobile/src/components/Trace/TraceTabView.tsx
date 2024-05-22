import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { Route, TabView, TabViewProps } from 'react-native-tab-view'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { Screens } from 'src/screens/Screens'
import { SectionNameType } from 'wallet/src/telemetry/constants'

type TraceRouteProps = { key: SectionNameType } & Route

export default function TraceTabView<T extends TraceRouteProps>({
  onIndexChange,
  navigationState,
  screenName,
  ...rest
}: TabViewProps<T> & { screenName: Screens }): JSX.Element {
  const onIndexChangeTrace = (index: number): void => {
    sendMobileAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      section: navigationState.routes[index]?.key,
      screen: screenName,
    })
    onIndexChange(index)
  }

  return <TabView navigationState={navigationState} onIndexChange={onIndexChangeTrace} {...rest} />
}

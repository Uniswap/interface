import React from 'react'
import { Route, TabView, TabViewProps } from 'react-native-tab-view'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { EventName, SectionName } from 'src/features/telemetry/constants'
import { useTrace } from 'src/features/telemetry/hooks'

type TraceRouteProps = { key: SectionName } & Route

export default function TraceTabView<T extends TraceRouteProps>({
  onIndexChange,
  navigationState,
  ...rest
}: TabViewProps<T>) {
  const parentTrace = useTrace()

  const onIndexChangeTrace = (index: number) => {
    sendAnalyticsEvent(EventName.Impression, {
      section: navigationState.routes[index].key,
      ...parentTrace,
    })
    onIndexChange(index)
  }

  return <TabView navigationState={navigationState} onIndexChange={onIndexChangeTrace} {...rest} />
}

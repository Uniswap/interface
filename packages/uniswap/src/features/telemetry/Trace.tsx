import { memo, PropsWithChildren } from 'react'
import { ElementName, InterfacePageName, ModalNameType, SectionName } from 'uniswap/src/features/telemetry/constants'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { ExtensionScreen } from 'uniswap/src/types/screens/extension'
import { MobileAppScreen } from 'uniswap/src/types/screens/mobile'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { TraceProps, Trace as UntypedTrace } from 'utilities/src/telemetry/trace/Trace'

// Universe typed version of ITraceContext
interface UniverseTraceContext {
  page?: InterfacePageName
  screen?: MobileAppScreen | ExtensionScreen
  section?: SectionName
  modal?: ModalNameType
  element?: ElementName
}

type BaseTraceProps = UniverseTraceContext & Omit<TraceProps, 'eventOnTrigger' | 'properties'>

function _Trace<EventName extends keyof UniverseEventProperties | undefined>({
  children,
  eventOnTrigger,
  properties,
  logImpression,
  logPress,
  logFocus,
  logKeyPress,
  ...rest
}: PropsWithChildren<
  BaseTraceProps & {
    eventOnTrigger?: EventName
    properties?: EventName extends keyof UniverseEventProperties
      ? UniverseEventProperties[EventName]
      : Record<string, unknown>
  }
>): JSX.Element {
  const typedProps: Record<string, unknown> | undefined = properties
    ? (properties as Record<string, unknown>)
    : undefined

  return (
    <UntypedTrace
      eventOnTrigger={eventOnTrigger}
      logFocus={logFocus}
      logImpression={logImpression}
      logKeyPress={logKeyPress}
      logPress={logPress}
      properties={typedProps}
      {...rest}
    >
      {children}
    </UntypedTrace>
  )
}

const typedMemo: <T>(c: T) => T = memo
const Trace = typedMemo(_Trace)

export { Trace }
export default Trace

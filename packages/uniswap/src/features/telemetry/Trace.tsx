import { PropsWithChildren, memo } from 'react'
import {
  ElementNameType,
  InterfacePageNameType,
  ModalNameType,
  SectionNameType,
} from 'uniswap/src/features/telemetry/constants'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { ExtensionScreen } from 'uniswap/src/types/screens/extension'
import { MobileAppScreen } from 'uniswap/src/types/screens/mobile'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TraceProps, Trace as UntypedTrace } from 'utilities/src/telemetry/trace/Trace'

// Universe typed version of ITraceContext
interface UniverseTraceContext {
  page?: InterfacePageNameType
  screen?: MobileAppScreen | ExtensionScreen
  section?: SectionNameType
  modal?: ModalNameType
  element?: ElementNameType
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
export default Trace

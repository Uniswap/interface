import { PropsWithChildren, memo } from 'react'
import {
  ElementNameType,
  ModalNameType,
  SectionNameType,
} from 'uniswap/src/features/telemetry/constants'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { ExtensionScreen } from 'uniswap/src/types/screens/extension'
import { MobileAppScreen } from 'uniswap/src/types/screens/mobile'
// eslint-disable-next-line no-restricted-imports
import { TraceProps, Trace as UntypedTrace } from 'utilities/src/telemetry/trace/Trace'

// Universe typed version of ITraceContext
interface UniverseTraceContext {
  screen?: MobileAppScreen | ExtensionScreen
  section?: SectionNameType
  modal?: ModalNameType
  element?: ElementNameType
}

type BaseTraceProps = UniverseTraceContext & Omit<TraceProps, 'pressEvent' | 'properties'>

function _Trace<EventName extends keyof UniverseEventProperties | undefined>({
  children,
  pressEvent,
  properties,
  ...rest
}: PropsWithChildren<
  BaseTraceProps & {
    pressEvent?: EventName
    properties?: EventName extends keyof UniverseEventProperties
      ? UniverseEventProperties[EventName]
      : Record<string, unknown>
  }
>): JSX.Element {
  const typedProps: Record<string, unknown> | undefined = properties
    ? (properties as Record<string, unknown>)
    : undefined
  return (
    <UntypedTrace pressEvent={pressEvent} properties={typedProps} {...rest}>
      {children}
    </UntypedTrace>
  )
}

const Trace = memo(_Trace)
export default Trace

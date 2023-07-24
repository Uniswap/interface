import { memo, PropsWithChildren } from 'react'
import {
  ElementName,
  ExtensionEventName,
  ModalName,
  ScreenName,
  SectionName,
} from 'src/app/features/telemetry/constants'
import { Trace as UntypedTrace, TraceProps } from 'wallet/src/features/telemetry/trace/Trace'

// Extension specific version of ITraceContext
interface ExtensionTraceContext {
  screen?: ScreenName
  section?: SectionName
  modal?: ModalName
  element?: ElementName
}

interface ExtensionTracePropsOverrides {
  pressEvent?: ExtensionEventName
}

type ExtensionTraceProps = ExtensionTraceContext &
  Omit<TraceProps, 'pressEvent'> &
  ExtensionTracePropsOverrides

function _Trace({ children, ...rest }: PropsWithChildren<ExtensionTraceProps>): JSX.Element {
  return <UntypedTrace {...rest}>{children}</UntypedTrace>
}

const Trace = memo(_Trace)
export default Trace

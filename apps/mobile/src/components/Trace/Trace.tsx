import { memo, PropsWithChildren } from 'react'
import {
  ElementName,
  ManualPageViewScreen,
  MobileEventName,
  ModalName,
  SectionName,
} from 'src/features/telemetry/constants'
import { AppScreen } from 'src/screens/Screens'
import { Trace as UntypedTrace, TraceProps } from 'utilities/src/telemetry/trace/Trace'

// Mobile specific version of ITraceContext
interface MobileTraceContext {
  screen?: AppScreen | ManualPageViewScreen
  section?: SectionName
  modal?: ModalName
  element?: ElementName
}

interface MobileTracePropsOverrides {
  pressEvent?: MobileEventName
}

type MobileTraceProps = MobileTraceContext &
  Omit<TraceProps, 'pressEvent'> &
  MobileTracePropsOverrides

function _Trace({ children, ...rest }: PropsWithChildren<MobileTraceProps>): JSX.Element {
  return <UntypedTrace {...rest}>{children}</UntypedTrace>
}

const Trace = memo(_Trace)
export default Trace

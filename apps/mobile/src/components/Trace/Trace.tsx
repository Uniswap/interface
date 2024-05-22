import { memo, PropsWithChildren } from 'react'
import { ManualPageViewScreen, MobileEventName } from 'src/features/telemetry/constants'
import { AppScreen } from 'src/screens/Screens'
import { TraceProps, Trace as UntypedTrace } from 'utilities/src/telemetry/trace/Trace'
import { ElementNameType, ModalNameType, SectionNameType } from 'wallet/src/telemetry/constants'

// Mobile specific version of ITraceContext
interface MobileTraceContext {
  screen?: AppScreen | ManualPageViewScreen
  section?: SectionNameType
  modal?: ModalNameType
  element?: ElementNameType
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

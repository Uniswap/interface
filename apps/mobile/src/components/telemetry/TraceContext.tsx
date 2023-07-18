import { createContext } from 'react'
import {
  ElementName,
  ManualPageViewScreen,
  MarkNames,
  ModalName,
  SectionName,
} from 'src/features/telemetry/constants'
import { AppScreen } from 'src/screens/Screens'

export const TraceContext = createContext<ITraceContext>({})

export interface ITraceContext {
  screen?: AppScreen | ManualPageViewScreen

  // Enclosed section name. Can be as wide or narrow as necessary to
  // provide telemetry context.
  section?: SectionName

  modal?: ModalName

  element?: ElementName

  // Keeps track of start time for given marks
  marks?: Record<MarkNames, number>
}

import { CoachmarkProps } from 'ui/src/components/coachmark/Coachmark'
import { NotImplementedError } from 'utilities/src/errors'

// TODO(CONS-1939): implement native coachmark for the mobile Pools tab first-load tooltip.
export function Coachmark(_props: CoachmarkProps): JSX.Element {
  throw new NotImplementedError('Coachmark')
}
